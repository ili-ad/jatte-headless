import { StateStore } from '../../chat-shim';
import type { Channel, PollOption as ChatShimPollOption, PollVote } from '../../chat-shim';
import { stopTyping as stopTypingImpl } from '../../chat-shim/typing';
import {
  clientOff,
  clientOn,
  createSubscription,
  type ChannelEventSubscription,
  type EventTargetLike,
} from './client';

export type { ChannelEventSubscription };

import {
  chatAPI,
  type AddAnswer,
  type AddAnswerInput,
  type AppSettings,
  type CreateReminderInput,
  type Message as APIMessage,
  type MuteUserInput,
  type UnmuteUserResponse,
  type RegisterSubscriptionsInput,
  type WebPushSubscription,
  type RoomDraft,
  type User,
  type UserAgentInfo,
  type ChannelUnpinResult,
  type SyncUserRequest,
  type SyncUserResponse,
} from './api/chatAPI';
import {
  createMessage,
  type CreateMessagePayload,
  type CreateMessageResult,
} from './api/messages';

type SendMessageResponse = { message: CreateMessageResult };

let localAnswerIdCounter = 0;

const createLocalAnswerId = () => {
  localAnswerIdCounter += 1;
  return `local-answer-${localAnswerIdCounter}`;
};

let localVoteIdCounter = 0;

const createLocalVoteId = () => {
  localVoteIdCounter += 1;
  return `local-vote-${localVoteIdCounter}`;
};

type PollOptionWithVotes = ChatShimPollOption & { vote_count?: number };

type PollStateData = {
  poll?: Record<string, unknown>;
  options?: PollOptionWithVotes[];
  latest_votes_by_option?: Record<string, PollVote[]>;
  vote_counts_by_option?: Record<string, number>;
  ownVotesByOptionId?: Record<string, PollVote>;
  maxVotedOptionIds?: string[];
  vote_count?: number;
  [key: string]: unknown;
};

type PollStateStoreLike = {
  getLatestValue?: () => PollStateData;
  dispatch?: (patch: Partial<PollStateData>) => void;
};

type PollLike = {
  id: string;
  state?: PollStateStoreLike;
  options?: PollOptionWithVotes[];
  latest_votes_by_option?: Record<string, PollVote[]>;
  vote_counts_by_option?: Record<string, number>;
  ownVotesByOptionId?: Record<string, PollVote>;
  maxVotedOptionIds?: string[];
  vote_count?: number;
  [key: string]: unknown;
};

type PollSnapshot = {
  latest_votes_by_option: Record<string, PollVote[]>;
  vote_counts_by_option: Record<string, number>;
  ownVotesByOptionId: Record<string, PollVote>;
  maxVotedOptionIds: string[];
  options: PollOptionWithVotes[];
  vote_count?: number;
};

type ChannelUserLike = { id?: string | null } & Record<string, unknown>;

type ChannelMessageLike = {
  cid?: string;
  id?: string;
  parent_id?: string | null;
  reply_count?: number;
  show_in_channel?: boolean;
  created_at?: string | Date | null;
  user?: ChannelUserLike | null;
} & Record<string, unknown>;

type NormalizedChannelMessage = ChannelMessageLike & { id: string };
type LoadMessageIntoStateInput = APIMessage | NormalizedChannelMessage;
type ChannelStateLoadMessageIntoStateFn = (
  message: LoadMessageIntoStateInput,
) => Promise<NormalizedChannelMessage>;

type ChannelStateLike = {
  messages?: ChannelMessageLike[];
  messagePagination?: { hasPrev?: boolean; hasNext?: boolean };
  loadMessageIntoState?: ChannelStateLoadMessageIntoStateFn;
  addMessageSorted?: (
    message: Record<string, unknown>,
    timestampChanged?: boolean,
  ) => void;
  [key: string]: unknown;
};

type ChannelWithLocalState = {
  cid: string;
  state?: ChannelStateLike;
  stateStore?: StateStore<any>;
};

type ChannelQueryResult = {
  messages: NormalizedChannelMessage[];
  next: number | null;
};

type ShimChannelQueryPaginationOptions = {
  limit?: number | string;
  id_lt?: number | string;
  id_gt?: number | string;
};

type ShimChannelQueryOptions = ShimChannelQueryPaginationOptions & {
  messages?: ShimChannelQueryPaginationOptions;
  [key: string]: unknown;
};

const firstDefined = <T>(...values: Array<T | undefined>): T | undefined => {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
};

const parseInteger = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const toDateSafe = (value: unknown): Date | undefined => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
};

const getMessageTimestamp = (message: ChannelMessageLike): number => {
  const createdAt = (message as { created_at?: Date | string | number }).created_at;
  const date = toDateSafe(createdAt);
  return date?.getTime() ?? 0;
};

const textFromApiMessage = (message: APIMessage): string => {
  const body = (message as { body?: unknown }).body;
  if (typeof body === "string") return body;
  const text = (message as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
};

const normalizeChannelMessage = (
  channel: ChannelWithLocalState,
  message: APIMessage,
): NormalizedChannelMessage => {
  const id = String(message.id);
  const createdAt = toDateSafe(message.created_at) ?? new Date();
  const updatedAt = toDateSafe((message as { updated_at?: unknown }).updated_at) ?? createdAt;
  const text = textFromApiMessage(message);
  const userId = typeof message.sent_by === "string" ? message.sent_by : String(message.sent_by ?? "");

  const base: NormalizedChannelMessage = {
    id,
    cid: channel.cid,
    created_at: createdAt,
    updated_at: updatedAt,
    type: "regular",
    status: "received",
    text,
    html: text,
    body: text,
    latest_reactions: [],
    own_reactions: [],
    reaction_groups: {},
    user: { id: userId },
    user_id: userId,
  };

  const deletedAt = (message as { deleted_at?: unknown }).deleted_at;
  if (deletedAt !== undefined) {
    const parsedDeleted = toDateSafe(deletedAt);
    base.deleted_at = parsedDeleted ?? deletedAt;
  }

  const existing = channel.state?.messages?.find?.(
    (msg) => String((msg as { id?: string | number }).id) === id,
  ) as NormalizedChannelMessage | undefined;

  return existing ? { ...existing, ...base } : base;
};

const isNormalizedChannelMessageInput = (
  message: LoadMessageIntoStateInput,
): message is NormalizedChannelMessage => {
  if (!message || typeof message !== "object") return false;

  const candidate = message as Partial<NormalizedChannelMessage>;
  return (
    typeof candidate.id === "string" && typeof candidate.cid === "string"
  );
};

function toNormalizedChannelMessage(
  channel: ChannelWithLocalState,
  message: LoadMessageIntoStateInput,
): NormalizedChannelMessage {
  if (isNormalizedChannelMessageInput(message)) {
    const existing = channel.state?.messages?.find?.(
      (msg) =>
        String((msg as { id?: string | number }).id ?? "") === message.id,
    ) as NormalizedChannelMessage | undefined;

    return existing ? { ...existing, ...message } : { ...message };
  }

  return normalizeChannelMessage(channel, message);
}

const updateChannelStateWithMessages = (
  channel: ChannelWithLocalState,
  incoming: NormalizedChannelMessage[],
  paginationUpdate?: { hasPrev?: boolean; hasNext?: boolean },
) => {
  ensureChannelStateLoadMessageIntoState(channel);
  if (!channel.state) return;

  const existingMessages = Array.isArray(channel.state.messages)
    ? channel.state.messages
    : [];

  const merged = new Map<string, NormalizedChannelMessage>();
  for (const existing of existingMessages) {
    const msgId = String((existing as { id?: string | number }).id ?? "");
    if (!msgId) continue;
    merged.set(msgId, existing as NormalizedChannelMessage);
  }

  for (const message of incoming) {
    merged.set(message.id, message);
  }

  const nextMessages = Array.from(merged.values()).sort(
    (a, b) => getMessageTimestamp(a) - getMessageTimestamp(b),
  );

  channel.state.messages = nextMessages;
  const pagination = (channel.state.messagePagination ??= {});

  if (paginationUpdate?.hasPrev !== undefined) {
    pagination.hasPrev = paginationUpdate.hasPrev;
  }
  if (paginationUpdate?.hasNext !== undefined) {
    pagination.hasNext = paginationUpdate.hasNext;
  }

  if (channel.stateStore?.dispatch) {
    channel.stateStore.dispatch({
      messages: nextMessages,
      messagePagination: { ...pagination },
    });
  }
};

function ensureChannelStateLoadMessageIntoState(
  channel: ChannelWithLocalState,
): ChannelStateLoadMessageIntoStateFn | undefined {
  const state = channel.state;
  if (!state) return undefined;

  if (typeof state.loadMessageIntoState === "function") {
    return state.loadMessageIntoState;
  }

  const load: ChannelStateLoadMessageIntoStateFn = async (message) => {
    const normalized = toNormalizedChannelMessage(channel, message);
    updateChannelStateWithMessages(channel, [normalized]);
    return normalized;
  };

  state.loadMessageIntoState = load;
  return load;
}

export function loadMessageIntoChannelState(
  channel: ChannelWithLocalState,
  message: LoadMessageIntoStateInput,
): Promise<NormalizedChannelMessage> {
  const loader = ensureChannelStateLoadMessageIntoState(channel);
  if (loader) {
    return loader(message);
  }

  const normalized = toNormalizedChannelMessage(channel, message);
  updateChannelStateWithMessages(channel, [normalized]);
  return Promise.resolve(normalized);
}

const extractMessageOptions = (
  options?: ShimChannelQueryOptions,
): ShimChannelQueryPaginationOptions => {
  if (!options) return {};

  const nested =
    typeof options.messages === "object" && options.messages !== null
      ? (options.messages as ShimChannelQueryPaginationOptions)
      : undefined;

  return {
    limit: firstDefined(options.limit, nested?.limit),
    id_lt: firstDefined(options.id_lt, nested?.id_lt),
    id_gt: firstDefined(options.id_gt, nested?.id_gt),
  };
};

type ChannelEventBase<Type extends string> = {
  type: Type;
  cid?: string;
  channel_id?: string;
  channel_type?: string;
  member?: Record<string, unknown>;
  message?: ChannelMessageLike | null;
  user?: ChannelUserLike | null;
  watcher_count?: number;
  [key: string]: unknown;
};

type NotificationEventFields = {
  first_unread_message_id?: string | null;
  last_read_at?: string | Date | null;
  last_read_message_id?: string | null;
  unread_messages?: number;
  user?: ChannelUserLike | null;
};

export type KnownChannelEventMap = {
  'ai_indicator.clear': ChannelEventBase<'ai_indicator.clear'>;
  'ai_indicator.update': ChannelEventBase<'ai_indicator.update'> & { ai_state?: string };
  'channel.archived': ChannelEventBase<'channel.archived'> & {
    archived?: boolean;
    at?: string;
    reason?: string;
  };
  'channel.deleted': ChannelEventBase<'channel.deleted'>;
  'channel.hidden': ChannelEventBase<'channel.hidden'>;
  'channel.truncated': ChannelEventBase<'channel.truncated'>;
  'channel.updated': ChannelEventBase<'channel.updated'> & {
    channel?: Record<string, unknown>;
  };
  'channel.visible': ChannelEventBase<'channel.visible'>;
  'connection.changed': ChannelEventBase<'connection.changed'> & { online?: boolean };
  'member.updated': ChannelEventBase<'member.updated'>;
  'message.deleted': ChannelEventBase<'message.deleted'>;
  'message.new': ChannelEventBase<'message.new'>;
  'message.undeleted': ChannelEventBase<'message.undeleted'>;
  'message.updated': ChannelEventBase<'message.updated'>;
  'notification.mark_read': ChannelEventBase<'notification.mark_read'> &
    Omit<NotificationEventFields, 'first_unread_message_id'>;
  'notification.mark_unread': ChannelEventBase<'notification.mark_unread'> & NotificationEventFields;
  'typing.start': ChannelEventBase<'typing.start'>;
  'typing.stop': ChannelEventBase<'typing.stop'>;
  'user.deleted': ChannelEventBase<'user.deleted'>;
  'user.watching.start': ChannelEventBase<'user.watching.start'>;
  'user.watching.stop': ChannelEventBase<'user.watching.stop'>;
};

export type ChannelKnownEvent = keyof KnownChannelEventMap;
export type ChannelUnknownEvent = ChannelEventBase<string>;
export type ChannelEventHandler<T extends ChannelKnownEvent> = (
  event: KnownChannelEventMap[T],
) => void;

type ClientSpecificEventMap = {
  all: ChannelUnknownEvent;
  'connection.recovered': ChannelEventBase<'connection.recovered'> & { online?: boolean };
  'notification.added_to_channel': ChannelEventBase<'notification.added_to_channel'> &
    NotificationEventFields;
  'notification.message_new': ChannelEventBase<'notification.message_new'> &
    NotificationEventFields;
  'notification.removed_from_channel': ChannelEventBase<'notification.removed_from_channel'> &
    NotificationEventFields;
  'notification.mutes_updated': { type: 'notification.mutes_updated'; me?: Record<string, unknown> } &
    Record<string, unknown>;
  'notification.channel_mutes_updated': {
    type: 'notification.channel_mutes_updated';
    [key: string]: unknown;
  };
  'user.updated': ChannelEventBase<'user.updated'> & { user?: ChannelUserLike | null };
  'user.presence.changed': ChannelEventBase<'user.presence.changed'> & {
    user?: ChannelUserLike | null;
  };
  'poll.vote_casted': {
    type: 'poll.vote_casted';
    poll_vote?: Record<string, unknown> | null;
    [key: string]: unknown;
  };
  'poll.vote_removed': {
    type: 'poll.vote_removed';
    poll_vote?: Record<string, unknown> | null;
    [key: string]: unknown;
  };
  'poll.vote_changed': {
    type: 'poll.vote_changed';
    poll_vote?: Record<string, unknown> | null;
    [key: string]: unknown;
  };
};

export type ClientKnownEventMap = KnownChannelEventMap & ClientSpecificEventMap;
export type ClientKnownEvent = keyof ClientKnownEventMap;
export type ClientEventHandler<T extends ClientKnownEvent> = (
  event: ClientKnownEventMap[T],
) => void;

const clientOnTyped = <TEvent extends ClientKnownEvent>(
  client: EventTargetLike | undefined,
  eventType: TEvent,
  handler: ClientEventHandler<TEvent>,
): ChannelEventSubscription =>
  clientOn(client, eventType, handler as (...args: any[]) => void);

export const client = {
  on: clientOnTyped,
};
export type CastVoteParams = {
  poll: PollLike;
  optionId: string;
  messageId: string | number;
  userId?: string | number;
  user?: PollVote['user'];
  now?: Date;
  request?: () => Promise<Partial<CastVoteResult> | void>;
};

export type CastVoteResult = {
  vote: PollVote;
  poll: PollSnapshot;
};

const cloneVote = (vote: PollVote): PollVote => ({
  ...vote,
  user: vote.user ? { ...vote.user } : vote.user,
});

const cloneVotesMap = (
  input?: Record<string, PollVote[]>,
): Record<string, PollVote[]> => {
  const result: Record<string, PollVote[]> = {};
  if (!input) return result;
  for (const [id, votes] of Object.entries(input)) {
    result[id] = votes.map((v) => cloneVote(v));
  }
  return result;
};

const cloneOwnVotes = (
  input?: Record<string, PollVote>,
): Record<string, PollVote> => {
  const result: Record<string, PollVote> = {};
  if (!input) return result;
  for (const [id, vote] of Object.entries(input)) {
    result[id] = cloneVote(vote);
  }
  return result;
};

const cloneVoteCounts = (
  input?: Record<string, number>,
): Record<string, number> => ({ ...(input ?? {}) });

const cloneOptionList = (
  options?: PollOptionWithVotes[],
): PollOptionWithVotes[] => (options ?? []).map((option) => ({ ...option }));

const cloneMaxIds = (ids?: string[]): string[] => (ids ? [...ids] : []);

const cloneSnapshot = (snapshot: PollSnapshot): PollSnapshot => ({
  latest_votes_by_option: cloneVotesMap(snapshot.latest_votes_by_option),
  vote_counts_by_option: cloneVoteCounts(snapshot.vote_counts_by_option),
  ownVotesByOptionId: cloneOwnVotes(snapshot.ownVotesByOptionId),
  maxVotedOptionIds: cloneMaxIds(snapshot.maxVotedOptionIds),
  options: cloneOptionList(snapshot.options),
  vote_count: snapshot.vote_count,
});

const getSnapshot = (
  poll: PollLike,
  store?: PollStateStoreLike,
): PollSnapshot => {
  const fromState = store?.getLatestValue?.();
  const statePoll = (fromState?.poll as PollLike | undefined) ?? undefined;

  const latestVotesSource =
    fromState?.latest_votes_by_option ??
    statePoll?.latest_votes_by_option ??
    poll.latest_votes_by_option;

  const voteCountsSource =
    fromState?.vote_counts_by_option ??
    statePoll?.vote_counts_by_option ??
    poll.vote_counts_by_option;

  const ownVotesSource =
    fromState?.ownVotesByOptionId ??
    statePoll?.ownVotesByOptionId ??
    poll.ownVotesByOptionId;

  const maxIdsSource =
    fromState?.maxVotedOptionIds ??
    statePoll?.maxVotedOptionIds ??
    poll.maxVotedOptionIds;

  const optionsSource =
    fromState?.options ??
    statePoll?.options ??
    poll.options ??
    [];

  const voteCountSource =
    fromState?.vote_count ??
    statePoll?.vote_count ??
    poll.vote_count;

  return {
    latest_votes_by_option: cloneVotesMap(latestVotesSource),
    vote_counts_by_option: cloneVoteCounts(voteCountsSource),
    ownVotesByOptionId: cloneOwnVotes(ownVotesSource),
    maxVotedOptionIds: cloneMaxIds(maxIdsSource),
    options: cloneOptionList(optionsSource as PollOptionWithVotes[]),
    vote_count: voteCountSource,
  };
};

const applySnapshot = (
  poll: PollLike,
  store: PollStateStoreLike | undefined,
  snapshot: PollSnapshot,
) => {
  const latestVotes = cloneVotesMap(snapshot.latest_votes_by_option);
  const voteCounts = cloneVoteCounts(snapshot.vote_counts_by_option);
  const ownVotes = cloneOwnVotes(snapshot.ownVotesByOptionId);
  const maxIds = cloneMaxIds(snapshot.maxVotedOptionIds);
  const options = cloneOptionList(snapshot.options);

  poll.latest_votes_by_option = latestVotes;
  poll.vote_counts_by_option = voteCounts;
  poll.ownVotesByOptionId = ownVotes;
  poll.maxVotedOptionIds = maxIds;
  poll.options = options;
  if (snapshot.vote_count !== undefined) {
    poll.vote_count = snapshot.vote_count;
  }

  const patch: Partial<PollStateData> = {
    latest_votes_by_option: latestVotes,
    vote_counts_by_option: voteCounts,
    ownVotesByOptionId: ownVotes,
    maxVotedOptionIds: maxIds,
    options,
  };
  if (snapshot.vote_count !== undefined) {
    patch.vote_count = snapshot.vote_count;
  }

  store?.dispatch?.(patch);
};

async function castVoteInternal(
  params: CastVoteParams,
): Promise<CastVoteResult> {
  const { poll, optionId, messageId, userId, user, now = new Date(), request } = params;

  if (!poll || typeof poll !== 'object') {
    throw new Error('castVote requires a poll instance');
  }

  const pollLike = poll as PollLike;
  const store = pollLike.state;

  const baseSnapshot = getSnapshot(pollLike, store);
  const nextSnapshot = cloneSnapshot(baseSnapshot);

  const normalizedOptionId = String(optionId);
  const option = nextSnapshot.options.find(
    (opt) => String(opt.id) === normalizedOptionId,
  );
  if (!option) {
    throw new Error(`Poll option ${optionId} not found`);
  }

  const pollIdSource =
    (pollLike as { id?: string | number }).id ??
    (option as { poll_id?: string | number }).poll_id;
  const pollId = pollIdSource !== undefined ? String(pollIdSource) : '';
  if (!pollId) {
    throw new Error('Poll id is required to cast a vote');
  }

  const normalizedUserId =
    userId !== undefined ? String(userId) : 'me';

  const existingOwnVote = nextSnapshot.ownVotesByOptionId[normalizedOptionId];
  if (
    existingOwnVote &&
    (existingOwnVote.user_id === normalizedUserId ||
      (existingOwnVote.user &&
        String(existingOwnVote.user.id) === normalizedUserId))
  ) {
    throw new Error('User has already voted for this option');
  }

  const createdAt = now.toISOString();
  const optimisticVote: PollVote = {
    id: createLocalVoteId(),
    poll_id: pollId,
    option_id: normalizedOptionId,
    user_id: normalizedUserId,
    user: user ?? ({ id: normalizedUserId } as PollVote['user']),
    created_at: createdAt,
    updated_at: createdAt,
  } as PollVote;

  if (messageId !== undefined) {
    (optimisticVote as Record<string, unknown>).message_id = messageId;
  }

  option.poll_id ??= pollId;

  const existingVotes = nextSnapshot.latest_votes_by_option[normalizedOptionId] ?? [];
  nextSnapshot.latest_votes_by_option[normalizedOptionId] = [
    optimisticVote,
    ...existingVotes,
  ];

  nextSnapshot.ownVotesByOptionId[normalizedOptionId] = optimisticVote;

  const newCount =
    (nextSnapshot.vote_counts_by_option[normalizedOptionId] ?? 0) + 1;
  nextSnapshot.vote_counts_by_option[normalizedOptionId] = newCount;
  option.vote_count = newCount;

  const baseTotalVotes =
    typeof baseSnapshot.vote_count === 'number'
      ? baseSnapshot.vote_count
      : typeof pollLike.vote_count === 'number'
        ? pollLike.vote_count
        : undefined;
  if (typeof baseTotalVotes === 'number') {
    nextSnapshot.vote_count = baseTotalVotes + 1;
  } else {
    nextSnapshot.vote_count = Object.values(
      nextSnapshot.vote_counts_by_option,
    ).reduce((total, count) => total + count, 0);
  }

  let maxCount = -Infinity;
  const maxIds: string[] = [];
  for (const [id, count] of Object.entries(
    nextSnapshot.vote_counts_by_option,
  )) {
    if (count > maxCount) {
      maxCount = count;
      maxIds.length = 0;
      maxIds.push(id);
    } else if (count === maxCount) {
      maxIds.push(id);
    }
  }
  nextSnapshot.maxVotedOptionIds = maxCount > 0 ? maxIds : [];

  applySnapshot(pollLike, store, nextSnapshot);

  try {
    if (request) {
      await request();
    }
    return {
      vote: {
        ...optimisticVote,
        user: optimisticVote.user ? { ...optimisticVote.user } : optimisticVote.user,
      },
      poll: cloneSnapshot(nextSnapshot),
    };
  } catch (error) {
    applySnapshot(pollLike, store, baseSnapshot);
    throw error;
  }
}

export const chatSDKShim = {
  async addAnswer(input: AddAnswerInput): Promise<AddAnswer> {
    const now = new Date().toISOString();
    const result: AddAnswer = {
      id: createLocalAnswerId(),
      poll_id: input.poll_id,
      option_id: input.option_id ?? null,
      text: input.text ?? null,
      created_by: 'me',
      created_at: now,
    };

    return input.extras ? { ...result, ...input.extras } : result;
  },
  async castVote(params: CastVoteParams): Promise<CastVoteResult> {
    return castVoteInternal(params);
  },
  channelCountUnread,
  client,
};

export const chatSDK = {
  channel: {
    archive: channelArchive,
    unarchive: channelUnarchive,
    pin: channelPin,
    unpin: channelUnpin,
  },
};

export async function addAnswer(input: AddAnswerInput): Promise<AddAnswer> {
  return chatSDKShim.addAnswer(input);
}

export async function castVote(
  params: CastVoteParams,
): Promise<CastVoteResult> {
  return chatSDKShim.castVote(params);
}

export async function removeVote(
  _voteId: string,
  _messageId: string,
): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

export async function createPollOption(
  pollId: string,
  data: { text: string },
): Promise<any> {
  const resp = await fetch(
    `/api/polls/${encodeURIComponent(pollId)}/options/`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  return resp.json();
}

export async function queryAnswers(
  poll: { id: string; queryAnswers?: (params?: any) => Promise<any> },
  params: { limit?: number; next?: string } = {},
): Promise<{ next?: string; votes: any[] }> {
  if (typeof poll.queryAnswers === 'function') {
    return poll.queryAnswers(params);
  }
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.next !== undefined) searchParams.set('next', params.next);
  const query = searchParams.toString();
  const resp = await fetch(
    `/api/polls/${encodeURIComponent(poll.id)}/answers/${
      query ? `?${query}` : ''
    }`,
    { credentials: 'same-origin' },
  );
  return resp.json();
}

export async function queryOptionVotes(
  poll: { id: string; queryOptionVotes?: (params?: any) => Promise<any> },
  params: {
    filter: { option_id: string };
    options?: { limit?: number; next?: string };
    sort?: Record<string, number>;
  },
): Promise<{ next?: string; votes: any[] }> {
  if (typeof poll.queryOptionVotes === 'function') {
    return poll.queryOptionVotes(params);
  }
  const searchParams = new URLSearchParams();
  if (params.filter?.option_id)
    searchParams.set('option_id', params.filter.option_id);
  if (params.options?.limit !== undefined)
    searchParams.set('limit', String(params.options.limit));
  if (params.options?.next !== undefined)
    searchParams.set('next', params.options.next);
  // ignoring sort except created_at
  const query = searchParams.toString();
  const resp = await fetch(
    `/api/polls/${encodeURIComponent(poll.id)}/votes/${
      query ? `?${query}` : ''
    }`,
    { credentials: 'same-origin' },
  );
  return resp.json();
}

export function pollsFromState(
  client: { polls?: { store?: StateStore<{ polls: any[] }> } },
  pollId: string,
): any | undefined {
  const polls = client.polls?.store?.getLatestValue().polls;
  if (!polls) return undefined;
  for (const p of polls) {
    if (!p) continue;
    if (p.id === pollId) return p;
    if ((p as any).poll?.id === pollId) return (p as any).poll;
  }
  return undefined;
}

type ChannelArchiveOptions = { reason?: string };
type ChannelArchiveResult = { archived: true; at: string };
type ChannelUnarchiveResult = { archived: false; at: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toUnarchivedMembership = (
  membership: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const next: Record<string, unknown> = { ...(membership ?? {}) };
  next.archived = false;
  next.archived_at = null;
  if ("archived_reason" in next) {
    delete next.archived_reason;
  }
  return next;
};

const applyLocalUnarchive = (
  channel: ChannelWithLocalState,
): Record<string, unknown> => {
  const state = channel.state as (ChannelStateLike & {
    membership?: Record<string, unknown>;
  }) | null | undefined;

  const currentMembership =
    state && isRecord(state.membership)
      ? (state.membership as Record<string, unknown>)
      : undefined;
  const nextMembership = toUnarchivedMembership(currentMembership);

  if (state) {
    (state as Record<string, unknown>).membership = nextMembership;
  }

  channel.stateStore?.dispatch({ membership: nextMembership });

  return nextMembership;
};

export async function channelArchive(
  channel: {
    archive?: (options?: ChannelArchiveOptions) => Promise<ChannelArchiveResult>;
  },
  options?: ChannelArchiveOptions,
): Promise<ChannelArchiveResult> {
  if (typeof channel.archive === "function") {
    return channel.archive(options);
  }
  const at = new Date().toISOString();
  return { archived: true as const, at };
}

export async function archive(
  channel: {
    archive?: (options?: ChannelArchiveOptions) => Promise<ChannelArchiveResult>;
  },
  options?: ChannelArchiveOptions,
): Promise<ChannelArchiveResult> {
  return channelArchive(channel, options);
}

export async function close(): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

const extractUnarchiveAt = (
  result: unknown,
  fallback: string,
): string => {
  if (!isRecord(result)) {
    return fallback;
  }
  const at = result.at;
  return typeof at === "string" ? at : fallback;
};

type ChannelWithUnarchive = ChannelWithLocalState & {
  unarchive?: () => Promise<
    ChannelUnarchiveResult | { archived?: boolean; at?: string } | void
  >;
};

export async function channelUnarchive(
  channel: ChannelWithUnarchive,
): Promise<ChannelUnarchiveResult> {
  const fallbackAt = new Date().toISOString();

  const result =
    typeof channel.unarchive === "function"
      ? await channel.unarchive()
      : undefined;

  applyLocalUnarchive(channel);

  const at = extractUnarchiveAt(result, fallbackAt);

  return { archived: false as const, at };
}

export async function unarchive(
  channel: ChannelWithUnarchive,
): Promise<ChannelUnarchiveResult> {
  return channelUnarchive(channel);
}

export async function truncate(channel: { cid: string }): Promise<void> {
  await fetch(`/api/rooms/${encodeURIComponent(channel.cid)}/truncate/`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
  });
}

export function channelCountUnread(
  channel: { countUnread?: (lastRead?: Date) => number },
  lastRead?: Date,
): number {
  return countUnread(channel, lastRead);
}

export function countUnread(
  channel: { countUnread?: (lastRead?: Date) => number },
  lastRead?: Date,
): number {
  if (typeof channel.countUnread === 'function') {
    return channel.countUnread(lastRead);
  }
  return 0;
}

export function lastRead(
  channel: { lastRead?: () => Date | undefined },
): Date | undefined {
  if (typeof channel.lastRead === 'function') {
    return channel.lastRead();
  }
  return undefined;
}

export async function channelGetReplies(
  channel: { getReplies?: (id: string, options?: any) => Promise<any> },
  parentId: string,
  options?: { limit?: number; id_lt?: string },
): Promise<{ messages: any[] }> {
  if (typeof channel.getReplies === "function") {
    return channel.getReplies(parentId, options);
  }
  return { messages: [] };
}

export async function channelMarkRead(channel: {
  markRead?: () => Promise<any>;
}): Promise<any> {
  if (typeof channel.markRead === "function") {
    return channel.markRead();
  }
  return undefined;
}

export async function markUnread(
  channel: { markUnread?: (id: string) => Promise<any> },
  messageId: string,
): Promise<any> {
  if (typeof channel.markUnread === "function") {
    return channel.markUnread(messageId);
  }
  return undefined;
}

export function channelOff(
  channel:
    | (Pick<Channel, "off"> & EventTargetLike)
    | { off?: (eventType?: string, handler?: (...args: any[]) => void) => void }
    | undefined,
  eventType?: string,
  handler?: (...args: any[]) => void,
): void {
  if (channel && typeof channel.off === "function") {
    channel.off(eventType, handler);
  }
}

export function channelOn<TEvent extends ChannelKnownEvent>(
  channel: Channel | undefined,
  eventType: TEvent,
  handler: ChannelEventHandler<TEvent>,
): ChannelEventSubscription;
export function channelOn(
  channel: Channel | undefined,
  eventType: string,
  handler: (event: ChannelUnknownEvent) => void,
): ChannelEventSubscription;
export function channelOn(
  channel: Channel | undefined,
  eventType: string,
  handler: (event: ChannelUnknownEvent) => void,
): ChannelEventSubscription {
  return createSubscription(
    channel as unknown as EventTargetLike | undefined,
    eventType,
    handler as (...args: any[]) => void,
  );
}

type ChannelPinTarget = string | ChannelMessageLike;

type ChannelWithPin = { pin?: (message?: ChannelPinTarget) => Promise<any> };

export async function channelPin(channel: ChannelWithPin): Promise<any>;
export async function channelPin(
  channel: ChannelWithPin,
  message: ChannelPinTarget,
): Promise<any>;
export async function channelPin(
  channel: ChannelWithPin,
  message?: ChannelPinTarget,
): Promise<any> {
  if (typeof channel.pin === "function") {
    return channel.pin(message);
  }
  return undefined;
}

export async function channelUnpin(
  channel: ChannelWithLocalState & { unpin?: () => Promise<unknown> },
): Promise<ChannelUnpinResult> {
  return chatAPI.channel.unpin({ channel });
}

export async function connectUser(
  user: { id: string; name?: string; image?: string } | undefined,
  jwt: string,
): Promise<SyncUserResponse> {
  const payload: (SyncUserRequest & { __token?: string }) = { __token: jwt };
  if (user && typeof user === 'object') {
    if (typeof (user as { name?: unknown }).name === 'string' && user.name) {
      payload.display_name = user.name;
    }
    if (typeof (user as { image?: unknown }).image === 'string' && user.image) {
      payload.image_url = user.image;
    }
  }

  return chatAPI.syncUser(payload);
}

export async function disconnectUser(): Promise<void> {
  await chatAPI.endSession();
}

export async function channelQuery(
  channel: ChannelWithLocalState & {
    query?: (options?: unknown) => Promise<ChannelQueryResult>;
  },
  options?: ShimChannelQueryOptions,
): Promise<ChannelQueryResult> {
  if (typeof channel.query === "function") {
    return channel.query(options);
  }

  if (!channel.cid) {
    return { messages: [], next: null };
  }

  const messageOptions = extractMessageOptions(options);
  const limit = parseInteger(messageOptions.limit);
  const before = parseInteger(messageOptions.id_lt);
  const after = parseInteger(messageOptions.id_gt);

  const { messages: apiMessages, next } = await chatAPI.channel.query({
    cid: channel.cid,
    limit: limit,
    before,
  });

  const filteredApiMessages =
    after !== undefined
      ? apiMessages.filter((msg) => {
          const msgId = parseInteger((msg as { id?: number | string }).id);
          return msgId !== undefined && msgId > after;
        })
      : apiMessages;

  const normalizedMessages = filteredApiMessages.map((msg) =>
    normalizeChannelMessage(channel, msg),
  );

  const paginationUpdate: { hasPrev?: boolean; hasNext?: boolean } = {};

  if (after !== undefined) {
    paginationUpdate.hasNext =
      limit !== undefined
        ? normalizedMessages.length >= limit
        : normalizedMessages.length > 0;
  } else {
    paginationUpdate.hasPrev = Boolean(next);
    if (before === undefined) {
      paginationUpdate.hasNext = false;
    }
  }

  updateChannelStateWithMessages(channel, normalizedMessages, paginationUpdate);

  return {
    messages: normalizedMessages,
    next,
  };
}

export async function sendMessage(
  channel: {
    cid: string;
    sendMessage?: (
      msg: CreateMessagePayload,
      options?: any,
    ) => Promise<SendMessageResponse>;
  },
  message: CreateMessagePayload,
  options?: any,
): Promise<SendMessageResponse> {
  if (typeof channel.sendMessage === 'function') {
    return channel.sendMessage(message, options);
  }
  const saved = await createMessage(channel.cid, message);
  return { message: saved };
}

export async function query(
  channel: { cid: string; query?: (opts: any) => Promise<any> },
  watchers: { limit?: number; offset?: number } = {},
): Promise<any> {
  if (typeof channel.query === "function") {
    return channel.query({ watch: true, watchers });
  }
  const params = new URLSearchParams();
  if (watchers.limit !== undefined) params.set('limit', String(watchers.limit));
  if (watchers.offset !== undefined)
    params.set('offset', String(watchers.offset));
  const q = params.toString();
  const resp = await fetch(
    `/api/rooms/${encodeURIComponent(channel.cid)}/members/${q ? `?${q}` : ''}`,
    { credentials: 'same-origin' },
  );
  const data = await resp.json();
  return { members: data };
}

export async function channelSendMessage(
  channel: { cid: string },
  message: CreateMessagePayload,
  _options?: any,
): Promise<SendMessageResponse> {
  const saved = await createMessage(channel.cid, message);
  return { message: saved };
}

export async function channelStateLoadMessageIntoState(
  channel: ChannelWithLocalState,
  messageId: string,
  around?: string,
  messageLimit?: number,
): Promise<NormalizedChannelMessage | undefined> {
  if (messageId === "latest") {
    const latestMessage = channel.state?.messages?.[
      (channel.state?.messages?.length ?? 1) - 1
    ];
    if (latestMessage) {
      return loadMessageIntoChannelState(
        channel,
        latestMessage as LoadMessageIntoStateInput,
      );
    }
    return undefined;
  }

  const numericMessageId = Number(messageId);
  if (!channel.cid || Number.isNaN(numericMessageId)) {
    return undefined;
  }

  const apiMessage = await chatAPI.getMessage({
    cid: channel.cid,
    message_id: numericMessageId,
  });

  return loadMessageIntoChannelState(channel, apiMessage);
}

type ChannelWatchable = ChannelWithLocalState & {
  watch?: (options?: ChannelWatchOptions) => Promise<ChannelWatchResult>;
  initialized?: boolean;
};

export type ChannelWatchOptions = ShimChannelQueryOptions & {
  watchers?: { limit?: number; offset?: number };
  presence?: boolean;
  state?: Record<string, unknown>;
};

export type ChannelWatchResult =
  | ChannelQueryResult
  | { [key: string]: unknown }
  | void;

export async function channelWatch(
  channel: ChannelWatchable,
  options?: ChannelWatchOptions,
): Promise<ChannelWatchResult> {
  if (typeof channel.watch === "function") {
    return channel.watch(options);
  }

  if (!channel.cid) {
    channel.initialized = true;
    return { messages: [] };
  }

  const result = await channelQuery(channel, options);
  channel.initialized = true;
  return result;
}

export function clientChannel(
  client: { channel?: (type: string, id?: string, extra?: any) => any },
  type: string,
  id?: string,
  extra?: any,
): any {
  if (typeof client.channel === "function") {
    return client.channel(type, id, extra);
  }
  return undefined;
}

export { clientOff, clientOn };

export function on<TEvent extends ChannelKnownEvent>(
  channel: Channel,
  eventType: TEvent,
  handler: ChannelEventHandler<TEvent>,
): ChannelEventSubscription;
export function on(
  channel: Channel,
  eventType: string,
  handler: (event: ChannelUnknownEvent) => void,
): ChannelEventSubscription;
export function on(
  target: EventTargetLike | undefined,
  eventType: string,
  handler: (...args: any[]) => void,
): ChannelEventSubscription;
export function on(
  target: Channel | EventTargetLike | undefined,
  eventType: string,
  handler: (...args: any[]) => void,
): ChannelEventSubscription {
  return createSubscription(
    target as unknown as EventTargetLike | undefined,
    eventType,
    handler,
  );
}

export function onPollVoteCasted(
  client: EventTargetLike | undefined,
  handler: (...args: any[]) => void,
): ChannelEventSubscription {
  return on(client, "poll.vote_casted", handler);
}

export function onPollVoteRemoved(
  client: EventTargetLike | undefined,
  handler: (...args: any[]) => void,
): ChannelEventSubscription {
  return on(client, "poll.vote_removed", handler);
}

export function onPollVoteChanged(
  client: EventTargetLike | undefined,
  handler: (...args: any[]) => void,
): ChannelEventSubscription {
  return on(client, "poll.vote_changed", handler);
}

export async function deleteMessage(messageId: string): Promise<any> {
  const resp = await fetch(`/api/messages/${encodeURIComponent(messageId)}/`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  return resp.json();
}

export async function clientDeleteMessage(
  _client: unknown,
  messageId: string,
): Promise<any> {
  const resp = await fetch(`/api/messages/${encodeURIComponent(messageId)}/`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  return resp.json();
}

export async function clientUpdateMessage(
  client: { updateMessage?: (id: string, text: string) => Promise<any> } | unknown,
  messageId: string,
  text: string,
): Promise<any> {
  if (
    typeof (client as any).updateMessage === "function"
  ) {
    return (client as any).updateMessage(messageId, text);
  }
  const resp = await fetch(`/api/messages/${encodeURIComponent(messageId)}/`, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return resp.json();
}

export async function findMessage(messageId: string): Promise<any> {
  const resp = await fetch(`/api/messages/${encodeURIComponent(messageId)}/`, {
    credentials: "same-origin",
  });
  return resp.json();
}

export async function clientQueryChannels(
  _client: unknown,
  options?: Record<string, any>,
): Promise<any[]> {
  const searchParams = new URLSearchParams();
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
  }
  const query = searchParams.toString();
  const resp = await fetch(`/api/rooms/${query ? `?${query}` : ""}`, {
    credentials: "same-origin",
  });
  return resp.json();
}

export async function clientQueryUsers(
  _client?: unknown,
): Promise<{ users: User[] }> {
  const users = await chatAPI.listUsers();
  return { users };
}

export async function clientRemindersCreateReminder(
  client: {
    reminders?: {
      createReminder?: ((params: CreateReminderInput) => Promise<any>) & {
        length?: number;
      };
    };
  },
  params: CreateReminderInput,
): Promise<any> {
  const createReminder = client.reminders?.createReminder as any;
  if (createReminder) {
    if (typeof createReminder.length === 'number' && createReminder.length >= 2) {
      const note = params.note ?? '';
      return createReminder(note, params.remind_at);
    }
    return createReminder(params);
  }
  return chatAPI.createReminder(params);
}

export async function remindersCreateReminder(
  reminders:
    | {
        createReminder?: ((params: CreateReminderInput) => Promise<any>) & {
          length?: number;
        };
      }
    | undefined,
  params: CreateReminderInput,
): Promise<any> {
  if (reminders?.createReminder) {
    const createReminder = reminders.createReminder as any;
    if (typeof createReminder.length === 'number' && createReminder.length >= 2) {
      const note = params.note ?? '';
      return createReminder(note, params.remind_at);
    }
    return createReminder(params);
  }
  return chatAPI.createReminder(params);
}

export async function clientRemindersDeleteReminder(
  client: { reminders?: { deleteReminder?: (id: string) => Promise<any> } },
  reminderId: string,
): Promise<any> {
  if (client.reminders?.deleteReminder) {
    return client.reminders.deleteReminder(reminderId);
  }
  const resp = await fetch(
    `/api/reminders/${encodeURIComponent(reminderId)}/`,
    {
      method: "DELETE",
      credentials: "same-origin",
    },
  );
  return resp.json();
}

export async function remindersDeleteReminder(
  reminders: { deleteReminder?: (id: string) => Promise<any> } | undefined,
  reminderId: string,
): Promise<any> {
  if (reminders?.deleteReminder) {
    return reminders.deleteReminder(reminderId);
  }
  const resp = await fetch(`/api/reminders/${encodeURIComponent(reminderId)}/`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  return resp.json();
}

export function clientThreadsActivate(client: {
  threads?: { activate?: () => void };
}): void {
  client.threads?.activate?.();
}

export function clientThreadsDeactivate(client: {
  threads?: { deactivate?: () => void };
}): void {
  client.threads?.deactivate?.();
}

export async function clientThreadsLoadNextPage(client: {
  threads?: { loadNextPage?: () => Promise<any> };
}): Promise<any> {
  if (client.threads?.loadNextPage) {
    return client.threads.loadNextPage();
  }
  const resp = await fetch('/api/threads/', { credentials: 'same-origin' });
  return resp.json();
}

export async function clientThreadsReload(client: {
  threads?: { reload?: () => Promise<any> };
}): Promise<any> {
  if (client.threads?.reload) {
    return client.threads.reload();
  }
  const resp = await fetch('/api/threads/', { credentials: 'same-origin' });
  return resp.json();
}

const fallbackThreadStateStore = new StateStore<any>({} as any);

export async function deleteReaction(
  messageId: string,
  reactionId: string,
): Promise<void> {
  await fetch(
    `/api/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(
      reactionId,
    )}/`,
    { method: 'DELETE', credentials: 'same-origin' },
  );
}

export async function flagMessage(messageId: string): Promise<any> {
  const resp = await fetch(
    `/api/messages/${encodeURIComponent(messageId)}/flag/`,
    { method: 'POST', credentials: 'same-origin' },
  );
  return resp.json();
}

export async function pinMessage(messageId: string): Promise<any> {
  const resp = await fetch(
    `/api/messages/${encodeURIComponent(messageId)}/pin/`,
    { method: 'POST', credentials: 'same-origin' },
  );
  return resp.json();
}

export async function unpinMessage(messageId: string): Promise<void> {
  await fetch(`/api/messages/${encodeURIComponent(messageId)}/unpin/`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
}

export async function sendReaction(
  messageId: string,
  type: string,
): Promise<any> {
  const resp = await fetch(
    `/api/messages/${encodeURIComponent(messageId)}/reactions/`,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    },
  );
  return resp.json();
}

export async function sendAction(
  messageId: string,
  action: Record<string, unknown>,
): Promise<any> {
  const resp = await fetch(
    `/api/messages/${encodeURIComponent(messageId)}/actions/`,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    },
  );
  return resp.json();
}

export async function queryReactions(
  message: { id: string; queryReactions?: (params?: any) => Promise<any> },
  params: {
    limit?: number;
    next?: string;
    reaction_type?: string;
    sort?: Record<string, number>;
  } = {},
): Promise<{ next?: string; reactions: any[] }> {
  if (typeof message.queryReactions === 'function') {
    return message.queryReactions(params);
  }
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.next !== undefined) searchParams.set('next', params.next);
  if (params.reaction_type !== undefined)
    searchParams.set('reaction_type', params.reaction_type);
  if (params.sort) {
    const [field, dir] = Object.entries(params.sort)[0] || [];
    if (field) {
      searchParams.set('sort', field);
      searchParams.set('direction', String(dir));
    }
  }
  const query = searchParams.toString();
  const resp = await fetch(
    `/api/messages/${encodeURIComponent(message.id)}/reactions/${
      query ? `?${query}` : ''
    }`,
    { credentials: 'same-origin' },
  );
  return resp.json();
}

export async function getAppSettings(): Promise<AppSettings> {
  return chatAPI.getAppSettings();
}

export async function getUserAgent(): Promise<string> {
  const { user_agent } = await chatAPI.listUserAgents();
  return user_agent;
}

export async function setUserAgent(userAgent: string): Promise<UserAgentInfo> {
  return chatAPI.setUserAgent(
    typeof userAgent === 'string' ? { user_agent: userAgent } : {},
  );
}

export async function getDraft(roomUuid: string): Promise<RoomDraft> {
  const drafts = await chatAPI.listRoomDrafts({ room_uuid: roomUuid });
  const firstDraft = drafts[0];
  if (firstDraft) {
    const text =
      typeof firstDraft.text === 'string'
        ? firstDraft.text
        : typeof firstDraft.body === 'string'
          ? (firstDraft.body as string) ?? ''
          : '';
    return { ...firstDraft, text, body: firstDraft.body ?? text };
  }
  return { text: '' };
}


const fallbackNotificationsStore = new StateStore<{ notifications: any[] }>({
  notifications: [],
});

export function clientThreadsState(client: {
  threads?: { state?: StateStore<any> };
}): StateStore<any> {
  return client.threads?.state ?? fallbackThreadStateStore;
}

export function notificationsStore(client: {
  notifications?: { store?: StateStore<{ notifications: any[] }> };
}): StateStore<{ notifications: any[] }> {
  return client.notifications?.store ?? fallbackNotificationsStore;
}

export async function muteUser(
  userId: string | number,
  options?: Pick<MuteUserInput, 'cid' | 'muted_until'>,
): Promise<void> {
  const cid = options?.cid;
  if (!cid) {
    throw new Error('muteUser requires a channel cid');
  }

  const numericId = typeof userId === 'number' ? userId : Number(userId);
  if (!Number.isInteger(numericId)) {
    throw new Error('muteUser requires a numeric user id');
  }

  await chatAPI.muteUser({
    cid,
    user_id: numericId,
    muted_until: options?.muted_until,
  });
}

export async function unmuteUser(
  userId: string | number,
): Promise<UnmuteUserResponse> {
  const numericId =
    typeof userId === 'number' ? userId : Number.parseInt(String(userId), 10);

  if (!Number.isInteger(numericId)) {
    throw new Error('unmuteUser requires a numeric user id');
  }

  return chatAPI.unmuteUser({ target_user_id: numericId });
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toPlainPushSubscription = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!value) return null;

  if (isPlainObject(value) && typeof value.toJSON === 'function') {
    const json = value.toJSON();
    if (isPlainObject(json)) {
      return json;
    }
  }

  return isPlainObject(value) ? value : null;
};

const collectWebPushSubscriptions = (
  input: unknown,
): WebPushSubscription[] => {
  const candidates = Array.isArray(input)
    ? input
    : input === undefined
      ? []
      : [input];

  const subscriptions: WebPushSubscription[] = [];

  for (const candidate of candidates) {
    const plain = toPlainPushSubscription(candidate);
    if (!plain) continue;

    const endpoint = plain.endpoint;
    if (typeof endpoint !== 'string') continue;

    const keys = plain.keys;
    if (!isPlainObject(keys)) continue;

    const p256dh = keys.p256dh;
    const auth = keys.auth;
    if (typeof p256dh !== 'string' || typeof auth !== 'string') continue;

    const subscription: WebPushSubscription = {
      endpoint,
      keys: { p256dh, auth },
    };

    if ('expirationTime' in plain) {
      const expiration = plain.expirationTime;
      if (expiration === null) {
        subscription.expirationTime = null;
      } else if (typeof expiration === 'number') {
        subscription.expirationTime = expiration;
      }
    }

    subscriptions.push(subscription);
  }

  return subscriptions;
};

const isValidPlatform = (
  value: unknown,
): value is RegisterSubscriptionsInput['platform'] =>
  value === 'web' || value === 'ios' || value === 'android';

const normalizeRegisterSubscriptionsBody = (
  result: unknown,
): RegisterSubscriptionsInput => {
  if (isPlainObject(result) && Array.isArray(result.subscriptions)) {
    const body: RegisterSubscriptionsInput = {
      subscriptions: collectWebPushSubscriptions(result.subscriptions),
    };

    if (typeof result.client_id === 'string') {
      body.client_id = result.client_id;
    }

    if (isValidPlatform(result.platform)) {
      body.platform = result.platform;
    }

    return body;
  }

  return { subscriptions: collectWebPushSubscriptions(result) };
};

export async function pollsRegisterSubscriptions(
  client?: { jwt?: string; polls?: { registerSubscriptions?: () => unknown } },
): Promise<void> {
  const result = await client?.polls?.registerSubscriptions?.();
  const body = normalizeRegisterSubscriptionsBody(result);
  await chatAPI.registerSubscriptions(body);
}

export async function remindersRegisterSubscriptions(
  client?: { jwt?: string; reminders?: { registerSubscriptions?: () => unknown } },
): Promise<void> {
  const result = await client?.reminders?.registerSubscriptions?.();
  const body = normalizeRegisterSubscriptionsBody(result);
  await chatAPI.registerSubscriptions(body);
}

export async function threadsRegisterSubscriptions(
  client?: { jwt?: string; threads?: { registerSubscriptions?: () => unknown } },
): Promise<void> {
  const result = await client?.threads?.registerSubscriptions?.();
  const body = normalizeRegisterSubscriptionsBody(result);
  await chatAPI.registerSubscriptions(body);
}

export function threadsUnregisterSubscriptions(client?: {
  threads?: { unregisterSubscriptions?: () => void };
}): void {
  client?.threads?.unregisterSubscriptions?.();
}

export function pollsUnregisterSubscriptions(client?: {
  polls?: { unregisterSubscriptions?: () => void };
}): void {
  client?.polls?.unregisterSubscriptions?.();
}

export function remindersUnregisterSubscriptions(client?: {
  reminders?: { unregisterSubscriptions?: () => void };
}): void {
  client?.reminders?.unregisterSubscriptions?.();
}

export function remindersInitTimers(client?: {
  reminders?: { initTimers?: () => void };
}): void {
  client?.reminders?.initTimers?.();
}

export function remindersClearTimers(client?: {
  reminders?: { clearTimers?: () => void };
}): void {
  client?.reminders?.clearTimers?.();
}

export function remindersScheduledOffsetsMs(client?: {
  reminders?: { scheduledOffsetsMs?: number[] };
}): number[] {
  return (
    client?.reminders?.scheduledOffsetsMs ?? [
      5 * 60 * 1000,
      30 * 60 * 1000,
      60 * 60 * 1000,
      24 * 60 * 60 * 1000,
    ]
  );
}

export async function remindersUpsertReminder(
  reminders:
    | {
        upsertReminder?: (
          messageId: string,
          remind_at: string,
        ) => Promise<any>;
      }
    | undefined,
  params: CreateReminderInput,
): Promise<any> {
  if (reminders?.upsertReminder) {
    return reminders.upsertReminder(
      String(params.message_id ?? ''),
      params.remind_at,
    );
  }
  return chatAPI.createReminder(params);
}

export async function search(
  client: {
    search?: (
      filter: Record<string, any>,
      query: Record<string, any>,
      options?: Record<string, any>,
    ) => Promise<any>;
  } | undefined,
  filter: Record<string, any>,
  query: Record<string, any>,
  options?: Record<string, any>,
): Promise<any> {
  if (client?.search) {
    return client.search(filter, query, options);
  }
  const resp = await fetch('/api/search/', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter, query, options }),
  });
  return resp.json();
}

export async function stopAIResponse(channel?: {
  stopAIResponse?: () => Promise<void>;
}): Promise<void> {
  await channel?.stopAIResponse?.();
}

export async function stopTyping(): Promise<void> {
  await stopTypingImpl();
}
