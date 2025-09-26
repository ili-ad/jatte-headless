import { StateStore } from '../../chat-shim';
import type { PollOption as ChatShimPollOption, PollVote } from '../../chat-shim';
import { stopTyping as stopTypingImpl } from '../../chat-shim/typing';

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
};

export const chatSDK = {
  channel: {
    archive: channelArchive,
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

export async function unarchive(channel: { cid: string }): Promise<void> {
  await fetch(`/api/rooms/${encodeURIComponent(channel.cid)}/unarchive`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
  });
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
  channel: {
    off?: (eventType?: string, handler?: (...args: any[]) => void) => void;
  },
  eventType?: string,
  handler?: (...args: any[]) => void,
): void {
  if (typeof channel.off === "function") {
    // Forward the call to the underlying channel if available
    (
      channel.off as (
        eventType?: string,
        handler?: (...args: any[]) => void,
      ) => void
    )(eventType, handler);
  }
}

export function channelOn(
  channel: {
    on?: (
      eventType: string,
      handler: (...args: any[]) => void,
    ) => { unsubscribe?: () => void };
  },
  eventType: string,
  handler: (...args: any[]) => void,
): { unsubscribe?: () => void } | undefined {
  if (typeof channel.on === "function") {
    return (
      channel.on as (
        eventType: string,
        handler: (...args: any[]) => void,
      ) => { unsubscribe?: () => void }
    )(eventType, handler);
  }
  return undefined;
}

export async function channelPin(
  channel: { pin?: (messageId: string) => Promise<any> },
  messageId: string,
): Promise<any> {
  if (typeof channel.pin === "function") {
    return channel.pin(messageId);
  }
  return undefined;
}

export async function channelUnpin(channel: {
  unpin?: () => Promise<any>;
}): Promise<any> {
  if (typeof channel.unpin === "function") {
    return channel.unpin();
  }
  return undefined;
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
  channel: { query?: (options?: any) => Promise<any> },
  options?: any,
): Promise<any> {
  if (typeof channel.query === "function") {
    return channel.query(options);
  }
  return { messages: [] };
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
  channel: {
    cid: string;
    state?: {
      loadMessageIntoState?: (
        id: string,
        around?: string,
        limit?: number,
      ) => Promise<any>;
      addMessageSorted?: (
        message: Record<string, unknown>,
        timestampChanged?: boolean,
      ) => void;
      messages?: Array<Record<string, unknown>>;
      messagePagination?: { hasNext?: boolean; hasPrev?: boolean };
    };
  },
  messageId: string,
  around?: string,
  messageLimit?: number,
): Promise<any> {
  if (channel.state?.loadMessageIntoState) {
    return channel.state.loadMessageIntoState(messageId, around, messageLimit);
  }

  const numericMessageId = Number(messageId);
  if (!channel.cid || Number.isNaN(numericMessageId)) {
    return undefined;
  }

  const apiMessage = await chatAPI.getMessage({
    cid: channel.cid,
    message_id: numericMessageId,
  });

  const normalizeMessage = (
    message: APIMessage,
  ): Record<string, unknown> & { id: string } => {
    const createdAt = new Date(message.created_at);
    const baseMessage = {
      id: String(message.id),
      cid: channel.cid,
      created_at: createdAt,
      updated_at: createdAt,
      type: 'regular',
      status: 'received',
      text: message.body,
      html: message.body,
      body: message.body,
      user: { id: message.sent_by },
      user_id: message.sent_by,
      latest_reactions: [] as unknown[],
      own_reactions: [] as unknown[],
      reaction_groups: {},
    } as Record<string, unknown> & { id: string };

    const existingMessage = channel.state?.messages?.find?.(
      (msg) => String((msg as { id?: string | number }).id) === baseMessage.id,
    );

    return existingMessage ? { ...existingMessage, ...baseMessage } : baseMessage;
  };

  const normalizedMessage = normalizeMessage(apiMessage);

  if (channel.state) {
    channel.state.messagePagination ??= {};
    channel.state.messagePagination.hasPrev ??= false;
    channel.state.messagePagination.hasNext ??= false;

    if (typeof channel.state.addMessageSorted === 'function') {
      channel.state.addMessageSorted(normalizedMessage, true);
    } else if (Array.isArray(channel.state.messages)) {
      const existingIndex = channel.state.messages.findIndex(
        (msg) => String((msg as { id?: string | number }).id) === normalizedMessage.id,
      );

      if (existingIndex >= 0) {
        channel.state.messages.splice(existingIndex, 1, normalizedMessage);
      } else {
        channel.state.messages.push(normalizedMessage);
        channel.state.messages.sort((a, b) => {
          const aDate = new Date(
            ((a as { created_at?: string | Date }).created_at ?? 0) as
              | string
              | Date,
          ).getTime();
          const bDate = new Date(
            ((b as { created_at?: string | Date }).created_at ?? 0) as
              | string
              | Date,
          ).getTime();
          return aDate - bDate;
        });
      }
    }
  }

  return normalizedMessage;
}

export async function channelWatch(
  channel: { cid: string },
  options?: Record<string, any>,
): Promise<{ messages: any[] }> {
  const searchParams = new URLSearchParams();
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
  }
  const query = searchParams.toString();
  const resp = await fetch(
    `/api/rooms/${encodeURIComponent(channel.cid)}/messages/${
      query ? `?${query}` : ""
    }`,
    { credentials: "same-origin" },
  );
  const data = await resp.json();
  return { messages: data };
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

export function clientOff(
  client: {
    off?: (eventType?: string, handler?: (...args: any[]) => void) => void;
  },
  eventType?: string,
  handler?: (...args: any[]) => void,
): void {
  if (typeof client.off === "function") {
    (
      client.off as (
        eventType?: string,
        handler?: (...args: any[]) => void,
      ) => void
    )(eventType, handler);
  }
}

export function clientOn(
  client: {
    on?: (
      eventType: string,
      handler: (...args: any[]) => void,
    ) => { unsubscribe?: () => void };
  },
  eventType: string,
  handler: (...args: any[]) => void,
): { unsubscribe?: () => void } | undefined {
  if (typeof client.on === "function") {
    return (
      client.on as (
        eventType: string,
        handler: (...args: any[]) => void,
      ) => { unsubscribe?: () => void }
    )(eventType, handler);
  }
  return undefined;
}

export function on(
  target: {
    on?: (
      eventType: string,
      handler: (...args: any[]) => void,
    ) => { unsubscribe?: () => void };
  },
  eventType: string,
  handler: (...args: any[]) => void,
): { unsubscribe?: () => void } | undefined {
  if (typeof target.on === "function") {
    return (
      target.on as (
        eventType: string,
        handler: (...args: any[]) => void,
      ) => { unsubscribe?: () => void }
    )(eventType, handler);
  }
  return undefined;
}

export function onPollVoteCasted(
  client: {
    on?: (
      eventType: string,
      handler: (...args: any[]) => void,
    ) => { unsubscribe?: () => void };
  },
  handler: (...args: any[]) => void,
): { unsubscribe?: () => void } | undefined {
  return on(client, "poll.vote_casted", handler);
}

export function onPollVoteRemoved(
  client: {
    on?: (
      eventType: string,
      handler: (...args: any[]) => void,
    ) => { unsubscribe?: () => void };
  },
  handler: (...args: any[]) => void,
): { unsubscribe?: () => void } | undefined {
  return on(client, "poll.vote_removed", handler);
}

export function onPollVoteChanged(
  client: {
    on?: (
      eventType: string,
      handler: (...args: any[]) => void,
    ) => { unsubscribe?: () => void };
  },
  handler: (...args: any[]) => void,
): { unsubscribe?: () => void } | undefined {
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
