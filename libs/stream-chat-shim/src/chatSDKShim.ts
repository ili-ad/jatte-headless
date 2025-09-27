import { StateStore } from '../../chat-shim';
import type {
  Channel,
  PollOption as ChatShimPollOption,
  PollVote,
  NotificationManagerState,
  StreamChat,
} from '../../chat-shim';
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
  type DeleteReactionParams,
  type DeleteReactionResult,
  type LoadNextPageArgs,
  type Message as APIMessage,
  type MuteUserInput,
  type UnmuteUserResponse,
  type RegisterSubscriptionsInput,
  type WebPushSubscription,
  type RoomDraft,
  type ThreadPage,
  type User,
  type UserAgentInfo,
  type ChannelUnpinResult,
  type PinMessageResult,
  type QueryAnswersParams as QueryAnswersAPIParams,
  type QueryAnswersPoll as QueryAnswersAPIPoll,
  type QueryAnswersResult as QueryAnswersAPIResult,
  type SendActionResult,
  type SyncUserRequest,
  type SyncUserResponse,
  type RemindersScheduledOffsetsMsParams,
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
  queryChannels: clientQueryChannels,
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

type PollWithQueryAnswers = QueryAnswersAPIPoll & {
  id: string;
  queryAnswers?: (
    params?: QueryAnswersAPIParams,
  ) => Promise<QueryAnswersAPIResult>;
};

export async function queryAnswers(
  poll: PollWithQueryAnswers,
  params: QueryAnswersAPIParams = {},
): Promise<QueryAnswersAPIResult> {
  if (typeof poll.queryAnswers === 'function') {
    return poll.queryAnswers(params);
  }
  return chatAPI.queryAnswers(poll, params);
}

export async function queryOptionVotes(
  poll: { id: string; queryOptionVotes?: (params?: any) => Promise<any> },
  params: {
    filter: { option_id: string };
    options?: { limit?: number; next?: string };
    sort?: Record<string, number>;
  },
): Promise<{ next?: string; prev?: string; votes: PollVote[]; count?: number }> {
  if (typeof poll.queryOptionVotes === 'function') {
    return poll.queryOptionVotes(params);
  }

  const { results, next, prev, count } = await chatAPI.queryOptionVotes({
    pollId: poll.id,
    optionId: params.filter.option_id,
    limit: params.options?.limit,
    cursor: params.options?.next,
  });

  const normalized: {
    next?: string;
    prev?: string;
    votes: PollVote[];
    count?: number;
  } = {
    votes: results,
  };

  if (typeof next === 'string' && next) {
    normalized.next = next;
  }
  if (typeof prev === 'string' && prev) {
    normalized.prev = prev;
  }
  if (typeof count === 'number') {
    normalized.count = count;
  }

  return normalized;
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

const toStringId = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const getClientUserId = (
  channel: ChannelWithLocalState & { getClient?: () => unknown },
): string | undefined => {
  if (typeof channel.getClient !== "function") return undefined;
  const client = channel.getClient();
  if (!isRecord(client)) return undefined;

  const directId =
    toStringId((client as { userID?: unknown }).userID) ??
    toStringId((client as { userId?: unknown }).userId);
  if (directId) return directId;

  const user = (client as { user?: unknown }).user;
  if (isRecord(user)) {
    return toStringId((user as { id?: unknown }).id);
  }

  return undefined;
};

const getOwnReadState = (
  state: ChannelStateLike | undefined,
  userId?: string,
): Record<string, unknown> | undefined => {
  const rawRead = state && (state as { read?: unknown }).read;
  if (!isRecord(rawRead)) return undefined;
  const readMap = rawRead as Record<string, unknown>;

  if (userId) {
    const direct = readMap[userId];
    if (isRecord(direct)) return direct;

    for (const value of Object.values(readMap)) {
      if (!isRecord(value)) continue;
      const candidateId =
        toStringId((value as { user_id?: unknown }).user_id) ??
        (isRecord((value as { user?: unknown }).user)
          ? toStringId(
              ((value as { user?: Record<string, unknown> }).user as {
                id?: unknown;
              }).id,
            )
          : undefined);
      if (candidateId && candidateId === userId) {
        return value;
      }
    }
  }

  for (const value of Object.values(readMap)) {
    if (isRecord(value)) return value;
  }

  return undefined;
};

const getMessageCreatedAt = (
  message: ChannelMessageLike,
): Date | undefined => {
  const createdAt = toDateSafe((message as { created_at?: unknown }).created_at);
  if (createdAt) return createdAt;
  return toDateSafe((message as { updated_at?: unknown }).updated_at);
};

const findMessageById = (
  messages: ChannelMessageLike[],
  id: string,
): ChannelMessageLike | undefined => {
  for (const message of messages) {
    if (toStringId((message as { id?: unknown }).id) === id) {
      return message;
    }
  }
  return undefined;
};

const findMessageIndexById = (
  messages: ChannelMessageLike[],
  id: string,
): number | undefined => {
  for (let index = 0; index < messages.length; index += 1) {
    if (toStringId((messages[index] as { id?: unknown }).id) === id) {
      return index;
    }
  }
  return undefined;
};

const shouldCountMessageAsUnread = (
  message: ChannelMessageLike,
  ownUserId?: string,
): boolean => {
  if (!isRecord(message)) return false;

  const type = (message as { type?: unknown }).type;
  if (type === "system" || type === "error" || type === "ephemeral") {
    return false;
  }

  const silent = (message as { silent?: unknown }).silent;
  if (silent === true) return false;

  const shadowed = (message as { shadowed?: unknown }).shadowed;
  if (shadowed === true) return false;

  const status = (message as { status?: unknown }).status;
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    if (normalized === "failed" || normalized === "sending" || normalized === "draft") {
      return false;
    }
  }

  const deletedAt = (message as { deleted_at?: unknown }).deleted_at;
  if (deletedAt !== undefined && deletedAt !== null) {
    const deletedDate = toDateSafe(deletedAt);
    if (deletedDate || deletedAt) {
      return false;
    }
  }

  const messageUser = (message as { user?: unknown }).user;
  const messageUserId =
    toStringId((message as { user_id?: unknown }).user_id) ||
    (isRecord(messageUser) ? toStringId((messageUser as { id?: unknown }).id) : undefined);

  if (ownUserId && messageUserId && messageUserId === ownUserId) {
    return false;
  }

  return true;
};

export function channelCountUnread(
  channel: ChannelWithLocalState & {
    countUnread?: (lastRead?: Date) => number;
    getClient?: () => unknown;
  },
  lastRead?: Date,
): number {
  return countUnread(channel, lastRead);
}

export function countUnread(
  channel: ChannelWithLocalState & {
    countUnread?: (lastRead?: Date) => number;
    getClient?: () => unknown;
  },
  lastRead?: Date,
): number {
  if (typeof channel.countUnread === "function") {
    const direct = channel.countUnread(lastRead);
    if (typeof direct === "number" && Number.isFinite(direct)) {
      return direct;
    }
  }

  const state = channel.state as ChannelStateLike | undefined;
  const ownUserId = getClientUserId(channel);
  const ownReadState = getOwnReadState(state, ownUserId);

  if (ownReadState) {
    const stored = (ownReadState as { unread_messages?: unknown }).unread_messages;
    if (typeof stored === "number" && Number.isFinite(stored)) {
      return stored;
    }
  }

  const messages = Array.isArray(state?.messages)
    ? (state?.messages as ChannelMessageLike[])
    : [];

  if (!messages.length) {
    return 0;
  }

  const referenceDate =
    lastRead ?? (ownReadState ? toDateSafe((ownReadState as { last_read?: unknown }).last_read) : undefined);
  let referenceTimestamp = referenceDate?.getTime();

  if (
    referenceTimestamp === undefined &&
    ownReadState &&
    typeof (ownReadState as { last_read_message_id?: unknown }).last_read_message_id === "string"
  ) {
    const knownMessage = findMessageById(
      messages,
      (ownReadState as { last_read_message_id: string }).last_read_message_id,
    );
    const createdAt = knownMessage ? getMessageCreatedAt(knownMessage) : undefined;
    if (createdAt) {
      referenceTimestamp = createdAt.getTime();
    }
  }

  const firstUnreadId =
    ownReadState &&
    typeof (ownReadState as { first_unread_message_id?: unknown }).first_unread_message_id === "string"
      ? (ownReadState as { first_unread_message_id: string }).first_unread_message_id
      : undefined;
  const firstUnreadIndex =
    firstUnreadId !== undefined ? findMessageIndexById(messages, firstUnreadId) : undefined;

  let unread = 0;
  for (let index = 0; index < messages.length; index += 1) {
    if (firstUnreadIndex !== undefined && index < firstUnreadIndex) {
      continue;
    }

    const message = messages[index];
    if (!shouldCountMessageAsUnread(message, ownUserId)) {
      continue;
    }

    if (referenceTimestamp !== undefined) {
      const createdAt = getMessageCreatedAt(message);
      if (!createdAt || createdAt.getTime() <= referenceTimestamp) {
        continue;
      }
    }

    unread += 1;
  }

  return unread;
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

  const { limit, offset } = watchers;
  const result = await chatAPI.query({
    cid: channel.cid,
    limit,
    offset,
  });

  return result;
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

type ChannelFilters = Record<string, unknown>;
type ChannelSortBase = Record<string, number | "asc" | "desc">;
type ChannelSort = ChannelSortBase | ChannelSortBase[];
type ChannelOptions = {
  limit?: number | string;
  offset?: number | string;
  message_limit?: number | string;
  watch?: boolean;
  state?: boolean | Record<string, unknown>;
  presence?: boolean;
  [key: string]: unknown;
};

type RoomRecord = {
  cid?: string | null;
  uuid?: string | null;
  id?: string | number | null;
  type?: string | null;
  name?: string | null;
  data?: Record<string, unknown> | null;
  status?: string | null;
  visible?: boolean | null;
  client?: unknown;
  agent?: unknown;
  url?: string | null;
  messages?: APIMessage[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

type SortDescriptor = { field: string; direction: 1 | -1 };

type HydratedChannel = {
  channel: Channel;
  room: RoomRecord;
  lastMessageAt?: number;
  createdAt?: number;
  updatedAt?: number;
  index: number;
};

type ErrorWithStatus = Error & { status?: number };

const DEFAULT_CHANNEL_TYPE = "messaging";
const MAX_LATEST_MESSAGES = 50;

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toTimestamp = (value: unknown): number | undefined => {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? undefined : time;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const normalizeSortDescriptors = (sort?: ChannelSort): SortDescriptor[] => {
  const descriptors: SortDescriptor[] = [];

  const pushDescriptor = (field: string, rawDirection: unknown) => {
    if (!field) return;
    let direction: 1 | -1 = 1;
    if (typeof rawDirection === "number") {
      direction = rawDirection < 0 ? -1 : 1;
    } else if (typeof rawDirection === "string") {
      direction = rawDirection.toLowerCase() === "desc" ? -1 : 1;
    }
    descriptors.push({ field, direction });
  };

  if (Array.isArray(sort)) {
    for (const entry of sort) {
      if (!entry || typeof entry !== "object") continue;
      for (const [field, raw] of Object.entries(entry)) {
        pushDescriptor(field, raw);
      }
    }
  } else if (sort && typeof sort === "object") {
    for (const [field, raw] of Object.entries(sort)) {
      pushDescriptor(field, raw);
    }
  }

  if (!descriptors.length) {
    descriptors.push({ field: "last_message_at", direction: -1 });
  }

  return descriptors;
};

const matchesFilterValue = (candidate: unknown, expected: unknown): boolean => {
  if (expected === undefined || expected === null) return true;
  if (Array.isArray(expected)) {
    return expected.some((item) => matchesFilterValue(candidate, item));
  }
  if (typeof expected === "object") {
    // complex filters (e.g. $or) are not supported in the shim yet – don't exclude the row
    return true;
  }
  if (candidate === expected) return true;
  if (typeof candidate === "number" || typeof candidate === "boolean") {
    return candidate === expected;
  }
  if (typeof candidate === "string") {
    return candidate === String(expected);
  }
  if (candidate === undefined || candidate === null) return false;
  return String(candidate) === String(expected);
};

const matchesRoomFilters = (
  room: RoomRecord,
  filters?: ChannelFilters,
): boolean => {
  if (!filters || typeof filters !== "object") return true;

  for (const [key, expected] of Object.entries(filters)) {
    if (expected === undefined || expected === null) continue;

    const fromRoom = (room as Record<string, unknown>)[key];
    const fromData =
      room.data && typeof room.data === "object"
        ? (room.data as Record<string, unknown>)[key]
        : undefined;

    if (fromRoom === undefined && fromData === undefined) {
      // unsupported filter – ignore rather than excluding the room entirely
      continue;
    }

    const candidate = fromRoom !== undefined ? fromRoom : fromData;
    if (!matchesFilterValue(candidate, expected)) {
      return false;
    }
  }

  return true;
};

const ensureCid = (room: RoomRecord): string | undefined => {
  if (typeof room.cid === "string" && room.cid) {
    return room.cid;
  }
  const type =
    typeof room.type === "string" && room.type ? room.type : DEFAULT_CHANNEL_TYPE;
  const identifier = room.uuid ?? room.id;
  if (identifier === undefined || identifier === null) {
    return undefined;
  }
  return `${type}:${String(identifier)}`;
};

const parseRoomMessages = (
  room: RoomRecord,
  messageLimit?: number,
): APIMessage[] => {
  const rawMessages = Array.isArray(room.messages)
    ? room.messages.filter((msg): msg is APIMessage =>
        Boolean(msg && typeof msg === "object" && "id" in (msg as object)),
      )
    : [];

  if (!rawMessages.length || messageLimit === 0) {
    return [];
  }

  rawMessages.sort((a, b) => {
    const aTs = toTimestamp(a.created_at) ?? 0;
    const bTs = toTimestamp(b.created_at) ?? 0;
    return aTs - bTs;
  });

  if (messageLimit !== undefined && messageLimit >= 0 && rawMessages.length > messageLimit) {
    return rawMessages.slice(-messageLimit);
  }

  return rawMessages;
};

const updateChannelPagination = (channel: Channel, hasPrev: boolean): void => {
  const pagination = channel.state.messagePagination ?? { hasPrev: false, hasNext: false };
  pagination.hasPrev = hasPrev;
  pagination.hasNext = false;
  channel.state.messagePagination = pagination;
  channel.stateStore?.dispatch?.({
    messagePagination: { ...pagination },
  });
};

const updateLatestMessages = (channel: Channel): void => {
  const latest = Array.isArray(channel.state.messages)
    ? channel.state.messages.slice(-MAX_LATEST_MESSAGES)
    : [];
  const stateWithLatest = channel.state as typeof channel.state & {
    latestMessages?: typeof latest;
  };
  stateWithLatest.latestMessages = latest;
  channel.stateStore?.dispatch?.({ latestMessages: latest } as any);
};

const hydrateChannelFromRoom = async (
  client: StreamChat,
  room: RoomRecord,
  messageLimit?: number,
): Promise<Omit<HydratedChannel, "index"> | null> => {
  const cid = ensureCid(room);
  if (!cid) return null;

  const [rawType, rawId] = cid.split(":");
  const channelType =
    typeof room.type === "string" && room.type ? room.type : rawType || DEFAULT_CHANNEL_TYPE;
  const channelId = rawId || String(room.uuid ?? room.id ?? "");
  if (!channelId) return null;

  const baseData =
    room.data && typeof room.data === "object"
      ? { ...(room.data as Record<string, unknown>) }
      : {};

  if (typeof room.name === "string" && room.name) {
    baseData.name = room.name;
  }
  if (room.status !== undefined) {
    baseData.status = room.status;
  }
  if (room.visible !== undefined) {
    baseData.visible = room.visible;
  }
  if (room.client !== undefined) {
    baseData.client = room.client;
  }
  if (room.agent !== undefined) {
    baseData.agent = room.agent;
  }
  if (room.url !== undefined) {
    baseData.url = room.url;
  }

  const channel = client.channel(channelType, channelId, {
    cid,
    id: channelId,
    data: baseData,
  }) as Channel;

  channel.data = { ...channel.data, ...baseData };

  const messages = parseRoomMessages(room, messageLimit);
  for (const message of messages) {
    await loadMessageIntoChannelState(channel, message);
  }

  updateChannelPagination(
    channel,
    Array.isArray(room.messages) && room.messages.length > messages.length,
  );
  updateLatestMessages(channel);

  const lastMessage = messages[messages.length - 1];
  const lastMessageAt = lastMessage
    ? toTimestamp(lastMessage.updated_at ?? lastMessage.created_at)
    : undefined;

  if (lastMessageAt !== undefined) {
    channel.data.last_message_at = new Date(lastMessageAt).toISOString();
  }

  return {
    channel,
    room,
    lastMessageAt,
    createdAt: toTimestamp(room.created_at),
    updatedAt: toTimestamp(room.updated_at),
  };
};

const extractRooms = (payload: unknown): RoomRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RoomRecord => Boolean(item && typeof item === "object"));
  }

  if (payload && typeof payload === "object") {
    const maybeResults = (payload as { results?: unknown }).results;
    if (Array.isArray(maybeResults)) {
      return maybeResults.filter((item): item is RoomRecord =>
        Boolean(item && typeof item === "object"),
      );
    }
  }

  return [];
};

const getSortFieldValue = (item: HydratedChannel, field: string): unknown => {
  switch (field) {
    case "last_message_at":
      return item.lastMessageAt;
    case "created_at":
      return item.createdAt;
    case "updated_at":
      return item.updatedAt;
    case "cid":
      return item.channel.cid;
    case "id":
      return item.channel.id;
    case "name":
      return item.channel.data?.name ?? item.room.name;
    case "member_count":
      return Object.keys(item.channel.state.members ?? {}).length;
    case "unread_count":
      return countUnread(item.channel);
    default: {
      const channelValue =
        item.channel.data && typeof item.channel.data === "object"
          ? (item.channel.data as Record<string, unknown>)[field]
          : undefined;
      if (channelValue !== undefined) return channelValue;
      return (item.room as Record<string, unknown>)[field];
    }
  }
};

const compareValuesWithDirection = (
  aValue: unknown,
  bValue: unknown,
  direction: 1 | -1,
): number => {
  if (aValue === bValue) return 0;

  const aMissing = aValue === undefined || aValue === null;
  const bMissing = bValue === undefined || bValue === null;
  if (aMissing || bMissing) {
    if (aMissing && bMissing) return 0;
    return aMissing ? 1 : -1;
  }

  const aTimestamp = toTimestamp(aValue);
  const bTimestamp = toTimestamp(bValue);
  if (aTimestamp !== undefined && bTimestamp !== undefined) {
    if (aTimestamp === bTimestamp) return 0;
    return aTimestamp < bTimestamp ? -direction : direction;
  }

  if (typeof aValue === "number" && typeof bValue === "number") {
    if (aValue === bValue) return 0;
    return aValue < bValue ? -direction : direction;
  }

  const aString = String(aValue).toLowerCase();
  const bString = String(bValue).toLowerCase();
  if (aString === bString) return 0;
  return aString < bString ? -direction : direction;
};

const compareHydratedChannels = (
  a: HydratedChannel,
  b: HydratedChannel,
  descriptors: SortDescriptor[],
): number => {
  for (const { field, direction } of descriptors) {
    const diff = compareValuesWithDirection(
      getSortFieldValue(a, field),
      getSortFieldValue(b, field),
      direction,
    );
    if (diff !== 0) {
      return diff;
    }
  }

  return a.index - b.index;
};

export async function clientQueryChannels(
  client: StreamChat,
  filters: ChannelFilters = {},
  sort: ChannelSort = {},
  options: ChannelOptions = {},
): Promise<Channel[]> {
  const searchParams = new URLSearchParams();
  const limit = toFiniteNumber(options.limit);
  const offset = toFiniteNumber(options.offset);

  if (limit !== undefined) {
    searchParams.set("limit", String(limit));
  }
  if (offset !== undefined) {
    searchParams.set("offset", String(offset));
  }

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null) continue;
    if (key === "limit" || key === "offset" || key === "message_limit") continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/rooms/${query ? `?${query}` : ""}`, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to query channels (status ${response.status})`,
    );
    (error as ErrorWithStatus).status = response.status;
    throw error;
  }

  const payload = (await response.json()) as unknown;
  const rooms = extractRooms(payload);
  const messageLimit = toFiniteNumber(options.message_limit);

  const hydrated: HydratedChannel[] = [];
  const seen = new Set<string>();

  for (const room of rooms) {
    if (!matchesRoomFilters(room, filters)) {
      continue;
    }

    const metadata = await hydrateChannelFromRoom(client, room, messageLimit);
    if (!metadata) continue;

    const { channel } = metadata;
    if (seen.has(channel.cid)) {
      continue;
    }
    seen.add(channel.cid);

    hydrated.push({ ...metadata, index: hydrated.length });
  }

  const descriptors = normalizeSortDescriptors(sort);
  hydrated.sort((a, b) => compareHydratedChannels(a, b, descriptors));

  return hydrated.map(({ channel }) => channel);
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
  options?: { cid?: string },
): Promise<any> {
  if (client.reminders?.deleteReminder) {
    return client.reminders.deleteReminder(reminderId);
  }
  return chatAPI.reminders.deleteReminder({
    cid: options?.cid ?? "",
    reminderId,
    client,
  });
}

export async function remindersDeleteReminder(
  reminders: { deleteReminder?: (id: string) => Promise<any> } | undefined,
  reminderId: string,
  options?: { cid?: string },
): Promise<any> {
  if (reminders?.deleteReminder) {
    return reminders.deleteReminder(reminderId);
  }
  return chatAPI.reminders.deleteReminder({
    cid: options?.cid ?? "",
    reminderId,
    client: { reminders },
  });
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

type ThreadPaginationClient = {
  threads?: {
    loadNextPage?: (options?: unknown) => Promise<unknown>;
  };
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const parseThreadMessages = (value: unknown): APIMessage[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is APIMessage => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<APIMessage>;
    return (
      typeof candidate.id === 'number' &&
      typeof candidate.body === 'string' &&
      typeof candidate.sent_by === 'string' &&
      typeof candidate.created_at === 'string'
    );
  });
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toBooleanLike = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value > 0 : fallback;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return fallback;
};

const parseThreadPage = (value: unknown): ThreadPage => {
  if (Array.isArray(value)) {
    return { messages: parseThreadMessages(value), hasMore: false };
  }

  if (!value || typeof value !== 'object') {
    return { messages: [], hasMore: false };
  }

  const record = value as Record<string, unknown>;
  const messagesSource =
    record.messages ??
    record.data ??
    record.results ??
    record.threads ??
    record.items ??
    record.replies;
  const messages = parseThreadMessages(messagesSource);

  const nextCursor =
    toOptionalString(record.nextCursor) ??
    toOptionalString(record.next_cursor) ??
    toOptionalString(record.next) ??
    toOptionalString(record.cursor);

  const hasMoreRaw =
    record.hasMore ??
    record.has_more ??
    record.more ??
    record.hasNext ??
    record.has_next;

  const page: ThreadPage = {
    messages,
    hasMore: toBooleanLike(hasMoreRaw, Boolean(nextCursor)),
  };

  if (nextCursor) {
    page.nextCursor = nextCursor;
  }

  return page;
};

const mapLoadNextPageArgs = (
  args?: LoadNextPageArgs,
): Record<string, unknown> | undefined => {
  if (!args) return undefined;

  const payload: Record<string, unknown> = {};

  if (typeof args.cid === 'string' && args.cid) {
    payload.cid = args.cid;
  }

  if (typeof args.parentId === 'string' && args.parentId) {
    payload.parentId = args.parentId;
    payload.parent_id = args.parentId;
  }

  if (isFiniteNumber(args.limit)) {
    payload.limit = args.limit;
  }

  if (typeof args.cursor === 'string' && args.cursor) {
    payload.cursor = args.cursor;
  }

  return Object.keys(payload).length ? payload : undefined;
};

export async function clientThreadsLoadNextPage(
  client: ThreadPaginationClient,
  args?: LoadNextPageArgs,
): Promise<ThreadPage> {
  const loadNextPage = client.threads?.loadNextPage;
  if (typeof loadNextPage !== 'function') {
    return { messages: [], hasMore: false };
  }

  const payload = mapLoadNextPageArgs(args);
  const result = await loadNextPage(payload);
  return parseThreadPage(result);
}

export async function clientThreadsReload(client: {
  threads?: { reload?: () => Promise<unknown> };
}): Promise<void> {
  if (typeof client.threads?.reload !== 'function') {
    return;
  }

  await client.threads.reload();
}

export async function deleteReaction(
  messageId: string,
  reactionType: string,
  options?: Partial<Pick<DeleteReactionParams, 'channel' | 'cid' | 'message' | 'userId'>>,
): Promise<DeleteReactionResult> {
  return chatAPI.deleteReaction({
    messageId,
    type: reactionType,
    ...(options ?? {}),
  });
}

export async function flagMessage(messageId: string): Promise<any> {
  return chatAPI.flagMessage({ messageId });
}

type PinMessageOptions = {
  channel?: Channel | null;
  message?: Record<string, unknown> | null;
  pinExpires?: string | Date | number | null;
  user?: Record<string, unknown> | null;
  now?: Date;
  cid?: string | null;
};

export async function pinMessage(
  messageId: string,
  options?: PinMessageOptions,
): Promise<PinMessageResult> {
  const { channel, message, pinExpires, user, now, cid } = options ?? {};

  const resolvedChannel = channel as
    | (Channel & { [key: string]: unknown })
    | undefined;

  const resolvedMessage =
    message && typeof message === 'object'
      ? (message as Record<string, unknown>)
      : undefined;

  const resolvedUser =
    (user && typeof user === 'object'
      ? (user as Record<string, unknown>)
      : undefined) ??
    (resolvedChannel?.getClient?.()?.user as Record<string, unknown> | undefined);

  const resolvedCid =
    (typeof cid === 'string' && cid) ??
    (typeof resolvedChannel?.cid === 'string' ? resolvedChannel.cid : undefined) ??
    (typeof resolvedMessage?.['cid'] === 'string'
      ? (resolvedMessage['cid'] as string)
      : undefined);

  const resolvedPinExpires =
    pinExpires !== undefined
      ? pinExpires
      : resolvedMessage?.['pin_expires'] ?? undefined;

  return chatAPI.pinMessage({
    messageId,
    channel: resolvedChannel as any,
    message: resolvedMessage,
    pinExpires: resolvedPinExpires,
    user: resolvedUser,
    now,
    cid: resolvedCid ?? null,
  });
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
): Promise<SendActionResult> {
  const normalizedAction: Record<string, string> = {};

  for (const [key, value] of Object.entries(action ?? {})) {
    if (typeof value === 'string') {
      normalizedAction[key] = value;
    } else if (value !== undefined && value !== null) {
      normalizedAction[key] = String(value);
    }
  }

  return chatAPI.sendAction(String(messageId), normalizedAction);
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


const fallbackNotificationsStore = new StateStore<NotificationManagerState>({
  notifications: [],
});

type ThreadManagerStateShape = {
  threads: any[];
  unseenThreadIds: string[];
  unreadThreadCount: number;
  pagination: {
    isLoadingNext: boolean;
    isLoadingPrev: boolean;
    nextCursor?: string | null;
  };
};

const createInitialThreadManagerState = (): ThreadManagerStateShape => ({
  threads: [],
  unseenThreadIds: [],
  unreadThreadCount: 0,
  pagination: { isLoadingNext: false, isLoadingPrev: false, nextCursor: null },
});

const fallbackThreadStateStore = new StateStore<ThreadManagerStateShape>(
  createInitialThreadManagerState(),
);

const threadStateByClient = new WeakMap<
  object,
  StateStore<ThreadManagerStateShape>
>();

export function clientThreadsState(client: {
  threads?: { state?: StateStore<any> };
}): StateStore<ThreadManagerStateShape> {
  if (!client) {
    return fallbackThreadStateStore;
  }

  const existing = client.threads?.state;
  if (existing?.getLatestValue) {
    return existing as StateStore<ThreadManagerStateShape>;
  }

  let store = threadStateByClient.get(client as object);
  if (!store) {
    store = new StateStore<ThreadManagerStateShape>(
      createInitialThreadManagerState(),
    );
    threadStateByClient.set(client as object, store);
  }

  if (client.threads) {
    (client.threads as { state?: StateStore<ThreadManagerStateShape> }).state =
      store;
  }

  return store;
}

export function notificationsStore(client: {
  notifications?: { store?: StateStore<NotificationManagerState> };
}): StateStore<NotificationManagerState> {
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

export function remindersScheduledOffsetsMs(
  client?: RemindersScheduledOffsetsMsParams['client'],
): number[] {
  return chatAPI.reminders.scheduledOffsetsMs({ client });
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
  return chatAPI.reminders.upsertReminder({
    reminders,
    reminder: params,
  });
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
