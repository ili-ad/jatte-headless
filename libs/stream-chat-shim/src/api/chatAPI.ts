import { getLocalClient } from 'chat-shim';
import { clearAllReminderTimers } from '../reminders/timerRegistry';
import { API_BASE as DEFAULT_API_BASE, CHAT_AUTH_MODE } from '../config/env';
import {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Event,
  LocalMessage,
  Notification,
  NotificationManagerState,
  Poll,
  PollAnswer,
  PollOption,
  PollVote,
  ReactionResponse,
  ReactionSort,
  StateStore,
  StreamChat,
  VotingVisibility,
} from 'chat-shim';
import type { ClientKnownEventMap } from '../chatSDKShim';
import type { ChannelEventSubscription, EventTargetLike } from '../client';
import { clientOn, createSubscription } from '../client';

// Base URLs (keep relative by default so Next rewrites still work)
let API_BASE = DEFAULT_API_BASE;

export function configureApiBase(base: string) {
  if (typeof base === 'string' && base.trim()) {
    API_BASE = base.trim().replace(/\/+$/, '');
    return;
  }
  API_BASE = DEFAULT_API_BASE;
}

function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  if (typeof token === 'string') {
    const trimmed = token.trim();
    authToken = trimmed ? trimmed : null;
    return;
  }
  authToken = null;
}

export async function authorizedFetch(
  input: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers || {});
  const method =
    typeof init.method === 'string' ? init.method.toUpperCase() : undefined;
  const mustAuth =
    CHAT_AUTH_MODE === 'strict' ||
    (method !== undefined && method !== 'GET');

  if (mustAuth && authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const requestInit: RequestInit = { ...init, headers };
  if (!('credentials' in requestInit)) {
    requestInit.credentials = 'same-origin';
  }

  const shouldRemainRelative =
    API_BASE && input.startsWith('/search/messages');

  return fetch(shouldRemainRelative ? input : apiUrl(input), requestInit);
}


type ChatSDKShimModule = typeof import('../chatSDKShim');

let chatSDKShimModulePromise: Promise<ChatSDKShimModule> | null = null;

const getChatSDKShimModule = (): Promise<ChatSDKShimModule> => {
  if (!chatSDKShimModulePromise) {
    chatSDKShimModulePromise = import('../chatSDKShim');
  }
  return chatSDKShimModulePromise;
};

const loadMessageIntoChannelState = async (
  channel: unknown,
  message: unknown,
) => {
  const module = await getChatSDKShimModule();
  return module.loadMessageIntoChannelState(channel as any, message as any);
};

const clientThreadsLoadNextPage = async (
  client: { threads?: { loadNextPage?: (options?: unknown) => Promise<unknown> } },
  args?: LoadNextPageArgs,
) => {
  const module = await getChatSDKShimModule();
  return module.clientThreadsLoadNextPage(client, args);
};

const invokeStopTyping = async (): Promise<void> => {
  const module = await getChatSDKShimModule();
  await module.stopTyping();
};

const clientOnTyped = <TEvent extends keyof ClientKnownEventMap>(
  client: EventTargetLike | undefined,
  eventType: TEvent,
  handler: (event: ClientKnownEventMap[TEvent]) => void,
): ChannelEventSubscription =>
  clientOn(client, eventType, handler as (...args: any[]) => void);

type ChannelWithEmitter = Channel & {
  emit?: (eventType: string, payload: Record<string, unknown>) => void;
  aiResponseAbortController?: AbortController;
};

const activeAIResponseControllers = new Map<string, AbortController>();

export const trackAIResponseAbortController = (
  cid: string,
  controller: AbortController,
): void => {
  activeAIResponseControllers.set(cid, controller);
};

const takeActiveAIResponseController = (
  cid: string,
  channel?: ChannelWithEmitter,
): AbortController | undefined => {
  const registered = activeAIResponseControllers.get(cid);
  if (registered) {
    activeAIResponseControllers.delete(cid);
    return registered;
  }

  const candidate = channel?.aiResponseAbortController;
  if (candidate instanceof AbortController) {
    delete channel.aiResponseAbortController;
    return candidate;
  }

  return undefined;
};

const getChannelByCid = (cid: string): ChannelWithEmitter | undefined => {
  if (!cid) return undefined;

  const client = getLocalClient() as
    | (StreamChat & {
        state?: { channels?: Map<string, ChannelWithEmitter> };
        activeChannels?: Record<string, ChannelWithEmitter>;
      })
    | undefined;

  const fromState = client?.state?.channels?.get?.(cid);
  if (fromState) {
    return fromState as ChannelWithEmitter;
  }

  const fromActive = client?.activeChannels?.[cid];
  if (fromActive) {
    return fromActive;
  }

  return undefined;
};

export type {
  ClientEventHandler,
  ClientKnownEvent,
  ClientKnownEventMap,
} from '../chatSDKShim';

export type DeleteMessageParams = {
  cid: string;
  message_id: string | number;
};

export type AddAnswerInput = {
  poll_id: string;
  option_id?: string | number;
  text?: string;
  extras?: Record<string, unknown>;
};

export type AddAnswer = {
  id: string | number;
  poll_id: string;
  option_id?: string | number | null;
  text?: string | null;
  created_by: string | number;
  created_at: string;
  [k: string]: unknown;
};

export type UpdateMessageInput = {
  cid: string;
  message_id: string | number;
  text: string;
};

export type CreateReminderInput = {
  cid: string;
  remind_at: string;
  message_id?: string | number;
  note?: string;
};

export type Reminder = {
  id: number;
  remind_at: string;
  message_id?: string | number | null;
  note?: string | null;
  created_by: number;
  created_at: string;
};

export type DeleteReminderParams = {
  cid: string;
  reminderId: string;
};

export type DeleteReminderResult = { ok: true; reminderId: string };

export type AppSettings = Record<string, unknown>;

export type UserAgentInfo = { user_agent: string };
export type SetUserAgentInput = Partial<UserAgentInfo>;

export type MuteStatus = { muted: boolean; muted_until: string | null };

export type Mute = {
  id: number;
  user_id: number;
  muted_until: string | null;
  muted_by: number;
  created_at: string;
};

export type MuteUserInput = { cid: string; user_id: number; muted_until?: string };

export type UnmuteUserRequest = { target_user_id: number };
export type UnmuteUserResponse = { target_user_id: number; muted: false };

export type User = { id: number; username: string } & Record<string, unknown>;

export type SyncUserRequest = Partial<Record<string, unknown>>;
export type SyncUserResponse = User;

export type WebPushKeys = { p256dh: string; auth: string };
export type WebPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: WebPushKeys;
};
export type RegisterSubscriptionsInput = {
  subscriptions: WebPushSubscription[];
  client_id?: string;
  platform?: 'web' | 'ios' | 'android';
};
export type RegisterSubscriptionsResponse = {
  subscriptions: WebPushSubscription[];
  client_id?: string | null;
  platform?: 'web' | 'ios' | 'android' | null;
};

export type Message = {
  id: string | number;
  body: string;
  created_at: string;
  sent_by: string;
  text?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type MessageLikeWithId = {
  id?: string | number | null;
  user_id?: string | number | null;
  user?: { id?: string | number | null } | null;
} & Record<string, unknown>;

export type FlagMessageParams = {
  message?: MessageLikeWithId | null;
  messageId?: string | number | null;
  userId?: string | number | null;
};

export type FlagMessageResult = {
  flagged: true;
  message_id: string | number;
  flagged_at: string;
  flagged_by?: string;
};

export type ChannelQueryRequest = {
  cid: string;
  limit?: number;
  before?: number;
};

export type ChannelQueryResponse = {
  messages: Message[];
  next: number | null;
};

export type SearchRequest = {
  q: string;
  cid?: string;
  limit?: number;
  offset?: number | string;
};

export type SearchResponse = {
  messages: LocalMessage[];
  next?: string;
};

export type ClientQueryChannelsParams = {
  client: StreamChat;
  filters?: ChannelFilters;
  sort?: ChannelSort;
  options?: ChannelOptions;
};

export type ThreadMessage = Message;

export type ThreadPreviewMessage = {
  id: string;
  text: string;
  created_at: string;
  deleted_at: string | null;
  sent_by: string;
};

export type ThreadPreview = {
  id: string;
  parent: ThreadPreviewMessage;
  replies: ThreadPreviewMessage[];
};

type PollVoteLike = PollVote | PollAnswer;

type PollOptionWithVotes = (PollOption & { vote_count?: number }) & Record<string, unknown>;

type PollStateValue = {
  answers_count?: number;
  description?: string;
  enforce_unique_vote?: boolean;
  is_closed?: boolean;
  max_votes_allowed?: number;
  maxVotedOptionIds: string[];
  latest_votes_by_option: Record<string, PollVote[]>;
  name?: string;
  options: PollOptionWithVotes[];
  ownAnswer?: PollAnswer;
  ownVotesByOptionId: Record<string, PollVote>;
  question?: string;
  text?: string;
  vote_count?: number;
  vote_counts_by_option: Record<string, number>;
  voting_visibility?: VotingVisibility;
};

type PollStateStore = StateStore<PollStateValue>;

type PollWithState = (Poll & PollStateValue & { state: PollStateStore }) & Record<string, unknown>;

type PollCandidate = {
  poll: Record<string, unknown>;
  store?: PollStateStore;
  sources: Record<string, unknown>[];
};

type PollStateSnapshotLike = Partial<
  PollStateValue & {
    answers?: unknown;
    latest_answers?: unknown;
    own_answer?: unknown;
  }
>;

export type QueryAnswersPoll = {
  id?: string | number;
  latest_votes_by_option?: unknown;
  ownAnswer?: unknown;
  own_answer?: unknown;
  answers?: unknown;
  latest_answers?: unknown;
  state?: PollStateStore | PollStateSnapshotLike | null;
} & Record<string, unknown>;

export type QueryAnswersParams = {
  limit?: number;
  next?: string;
};

export type QueryAnswersResult = {
  next?: string;
  votes: PollAnswer[];
};

export type QueryOptionVotesParams = {
  pollId: string;
  optionId: string;
  limit?: number;
  cursor?: string;
};

export type QueryOptionVotesResponse = {
  results: PollVote[];
  next?: string | null;
  prev?: string | null;
  count?: number;
};

export type PollsFromStateParams = {
  client?: { polls?: { store?: StateStore<{ polls: unknown[] }> } } | StreamChat;
  pollId: string | number;
  sources?: Array<unknown>;
};

export type PollsFromStateResult = PollWithState;

const pollFromClientStore = (
  client: { polls?: { store?: StateStore<{ polls: any[] }> } } | StreamChat | undefined,
  pollId: string,
): any | undefined => {
  const store = client && (client as { polls?: { store?: StateStore<{ polls: any[] }> } }).polls?.store;
  if (!store) {
    return undefined;
  }

  const snapshot = store.getLatestValue();
  const polls = snapshot?.polls;
  if (!polls) return undefined;

  for (const entry of polls) {
    if (!entry) continue;
    if ((entry as { id?: unknown }).id === pollId) {
      return entry;
    }
    const nestedPoll = (entry as { poll?: { id?: unknown } }).poll;
    if (nestedPoll && (nestedPoll as { id?: unknown }).id === pollId) {
      return nestedPoll;
    }
  }

  return undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringMaybe = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const toNumberMaybe = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const toBooleanMaybe = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

const toDateISOString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return undefined;
};

const toVotingVisibilityValue = (
  value: unknown,
): VotingVisibility | undefined => {
  if (value === 'anonymous' || value === 'public') {
    return value;
  }
  return undefined;
};

const isStateStore = (value: unknown): value is PollStateStore =>
  !!value &&
  typeof value === 'object' &&
  (typeof (value as PollStateStore).getLatestValue === 'function' ||
    typeof (value as PollStateStore).getState === 'function');

const unwrapPollCandidate = (value: unknown): PollCandidate | undefined => {
  if (!isRecord(value)) return undefined;

  const nestedPoll = (value as { poll?: unknown }).poll;
  const pollRecord = isRecord(nestedPoll)
    ? (nestedPoll as Record<string, unknown>)
    : (value as Record<string, unknown>);

  const storeFromPoll = isStateStore(
    (pollRecord as { state?: unknown }).state,
  )
    ? ((pollRecord as { state?: PollStateStore }).state as PollStateStore)
    : undefined;

  const storeFromValue = !storeFromPoll &&
    isStateStore((value as { state?: unknown }).state)
      ? ((value as { state?: PollStateStore }).state as PollStateStore)
      : undefined;

  const store = storeFromPoll ?? storeFromValue;

  const sources: Record<string, unknown>[] = [];
  if (pollRecord !== value) {
    sources.push(value as Record<string, unknown>);
  }

  const pollState = (pollRecord as { state?: unknown }).state;
  if (isRecord(pollState) && !isStateStore(pollState)) {
    sources.push(pollState as Record<string, unknown>);
  }

  const valueState = (value as { state?: unknown }).state;
  if (isRecord(valueState) && !isStateStore(valueState)) {
    sources.push(valueState as Record<string, unknown>);
  }

  return { poll: pollRecord, store: store ?? undefined, sources };
};

const pickFirstFromSources = (
  sources: Record<string, unknown>[],
  ...keys: string[]
): unknown => {
  for (const source of sources) {
    for (const key of keys) {
      if (key in source) {
        const value = source[key];
        if (value !== undefined) return value;
      }
    }
  }
  return undefined;
};

const toPollOption = (
  candidate: unknown,
  pollId: string,
): PollOptionWithVotes | undefined => {
  if (!isRecord(candidate)) return undefined;
  const id = toStringMaybe(candidate.id);
  if (!id) return undefined;
  const poll_id = toStringMaybe(candidate.poll_id) ?? pollId;
  const text =
    toStringMaybe(candidate.text) ??
    toStringMaybe(candidate.value) ??
    toStringMaybe(candidate.name) ??
    '';

  const normalized: PollOptionWithVotes = {
    ...(candidate as Record<string, unknown>),
    id,
    poll_id,
    text,
  };

  const voteCount = toNumberMaybe(candidate.vote_count);
  if (voteCount !== undefined) {
    normalized.vote_count = voteCount;
  }

  return normalized;
};

const collectOptionsMap = (
  sources: Record<string, unknown>[],
  pollId: string,
): Map<string, PollOptionWithVotes> => {
  const map = new Map<string, PollOptionWithVotes>();
  for (const source of sources) {
    const rawOptions = (source as { options?: unknown }).options;
    if (!Array.isArray(rawOptions)) continue;
    for (const optionCandidate of rawOptions) {
      const normalized = toPollOption(optionCandidate, pollId);
      if (!normalized) continue;
      const existing = map.get(normalized.id);
      if (existing) {
        map.set(normalized.id, {
          ...existing,
          ...(isRecord(optionCandidate)
            ? (optionCandidate as Record<string, unknown>)
            : {}),
          ...normalized,
        });
      } else {
        map.set(
          normalized.id,
          {
            ...(isRecord(optionCandidate)
              ? (optionCandidate as Record<string, unknown>)
              : {}),
            ...normalized,
          },
        );
      }
    }
  }
  return map;
};

const ensureOption = (
  options: Map<string, PollOptionWithVotes>,
  optionId: string,
  pollId: string,
): PollOptionWithVotes => {
  let option = options.get(optionId);
  if (!option) {
    option = { id: optionId, poll_id: pollId, text: '' } as PollOptionWithVotes;
    options.set(optionId, option);
  } else {
    option.poll_id = toStringMaybe(option.poll_id) ?? pollId;
  }
  return option;
};

const collectVoteCounts = (
  sources: Record<string, unknown>[],
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const source of sources) {
    const rawCounts = (source as { vote_counts_by_option?: unknown }).vote_counts_by_option;
    if (!isRecord(rawCounts)) continue;
    for (const [optionId, value] of Object.entries(rawCounts)) {
      if (result[optionId] !== undefined) continue;
      const count = toNumberMaybe(value);
      if (count !== undefined) {
        result[optionId] = count;
      }
    }
  }
  return result;
};

const toPollVote = (
  candidate: Record<string, unknown>,
  pollId: string,
  optionId: string,
): PollVote | undefined => {
  const id = toStringMaybe(candidate.id);
  if (!id) return undefined;
  const createdAt = toDateISOString(candidate.created_at);
  const updatedAt = toDateISOString(candidate.updated_at) ?? createdAt;
  if (!createdAt || !updatedAt) return undefined;

  const normalized: PollVote = {
    ...(candidate as Record<string, unknown>),
    id,
    poll_id: toStringMaybe(candidate.poll_id) ?? pollId,
    option_id: toStringMaybe(candidate.option_id) ?? optionId,
    created_at: createdAt,
    updated_at: updatedAt,
  } as PollVote;

  const userId = toStringMaybe(candidate.user_id);
  if (userId !== undefined) {
    normalized.user_id = userId;
  }
  if (candidate.user && isRecord(candidate.user)) {
    normalized.user = candidate.user as PollVote['user'];
  }

  return normalized;
};

const collectLatestVotes = (
  sources: Record<string, unknown>[],
  pollId: string,
): Record<string, PollVote[]> => {
  const map = new Map<string, Map<string, PollVote>>();
  for (const source of sources) {
    const rawVotes = (source as { latest_votes_by_option?: unknown }).latest_votes_by_option;
    if (!isRecord(rawVotes)) continue;
    for (const [optionKey, votesValue] of Object.entries(rawVotes)) {
      const optionId = toStringMaybe(optionKey) ?? optionKey;
      const votesList = Array.isArray(votesValue) ? votesValue : [];
      if (!votesList.length) continue;
      let voteMap = map.get(optionId);
      if (!voteMap) {
        voteMap = new Map<string, PollVote>();
        map.set(optionId, voteMap);
      }
      for (const voteCandidate of votesList) {
        if (!isRecord(voteCandidate)) continue;
        const normalized = toPollVote(voteCandidate, pollId, optionId);
        if (!normalized) continue;
        if (!voteMap.has(normalized.id)) {
          voteMap.set(normalized.id, normalized);
        } else {
          const existing = voteMap.get(normalized.id)!;
          voteMap.set(normalized.id, { ...existing, ...normalized });
        }
      }
    }
  }

  const result: Record<string, PollVote[]> = {};
  for (const [optionId, votes] of map) {
    result[optionId] = Array.from(votes.values());
  }
  return result;
};

const collectOwnVotes = (
  sources: Record<string, unknown>[],
  pollId: string,
): Record<string, PollVote> => {
  const result: Record<string, PollVote> = {};
  for (const source of sources) {
    const rawOwnVotes =
      (source as { ownVotesByOptionId?: unknown }).ownVotesByOptionId ??
      (source as { own_votes_by_option?: unknown }).own_votes_by_option ??
      (source as { own_votes?: unknown }).own_votes;
    if (!isRecord(rawOwnVotes)) continue;
    for (const [optionKey, voteValue] of Object.entries(rawOwnVotes)) {
      if (result[optionKey]) continue;
      if (!isRecord(voteValue)) continue;
      const normalized = toPollVote(voteValue, pollId, optionKey);
      if (normalized) {
        result[optionKey] = normalized;
      }
    }
  }
  return result;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const result: string[] = [];
  for (const entry of value) {
    const str = toStringMaybe(entry);
    if (str !== undefined) result.push(str);
  }
  return result;
};

const collectMaxIds = (sources: Record<string, unknown>[]): string[] => {
  for (const source of sources) {
    const raw = (source as { maxVotedOptionIds?: unknown }).maxVotedOptionIds;
    const normalized = toStringArray(raw);
    if (normalized && normalized.length) return normalized;
  }
  return [];
};

const toPollAnswer = (
  candidate: unknown,
  pollId: string,
): PollAnswer | undefined => {
  if (!isRecord(candidate)) return undefined;
  const id = toStringMaybe(candidate.id);
  if (!id) return undefined;
  const createdAt = toDateISOString(candidate.created_at);
  const updatedAt = toDateISOString(candidate.updated_at) ?? createdAt;
  if (!createdAt || !updatedAt) return undefined;
  const answerText = toStringMaybe(candidate.answer_text) ?? '';
  const isAnswer = toBooleanMaybe(candidate.is_answer);

  const normalized: PollAnswer = {
    ...(candidate as Record<string, unknown>),
    id,
    poll_id: toStringMaybe(candidate.poll_id) ?? pollId,
    created_at: createdAt,
    updated_at: updatedAt,
    answer_text: answerText,
    is_answer: isAnswer ?? true,
  } as PollAnswer;

  const userId = toStringMaybe(candidate.user_id);
  if (userId !== undefined) {
    normalized.user_id = userId;
  }
  if (candidate.user && isRecord(candidate.user)) {
    normalized.user = candidate.user as PollAnswer['user'];
  }

  return normalized;
};

const toUserRecord = (
  value: unknown,
): Record<string, unknown> | null | undefined => {
  if (value === null) return null;
  if (isRecord(value)) {
    const result: Record<string, unknown> = { ...value };
    const id = toStringMaybe(value.id ?? (value as { user_id?: unknown }).user_id);
    if (id !== undefined) {
      result.id = id;
    }
    if ('user_id' in result && typeof result.user_id === 'number') {
      result.user_id = String(result.user_id);
    }
    return result;
  }
  const id = toStringMaybe(value);
  if (id !== undefined) return { id };
  return undefined;
};

const collectCandidateSources = (
  candidates: PollCandidate[],
): Record<string, unknown>[] => {
  const sources: Record<string, unknown>[] = [];
  for (const candidate of candidates) {
    const snapshot =
      candidate.store?.getLatestValue?.() ?? candidate.store?.getState?.();
    if (snapshot && isRecord(snapshot)) {
      sources.push(snapshot);
    }
  }
  for (const candidate of candidates) {
    sources.push(candidate.poll);
    for (const extra of candidate.sources) {
      if (isRecord(extra)) sources.push(extra);
    }
  }
  return sources;
};

const pickVoteCount = (
  sources: Record<string, unknown>[],
  voteCounts: Record<string, number>,
  latestVotes: Record<string, PollVote[]>,
): number | undefined => {
  const direct = toNumberMaybe(
    pickFirstFromSources(sources, 'vote_count', 'total_votes'),
  );
  if (direct !== undefined) return direct;

  const counts = Object.values(voteCounts);
  if (counts.length) {
    return counts.reduce((sum, count) => sum + count, 0);
  }

  const voteTotals = Object.values(latestVotes).reduce(
    (total, votes) => total + votes.length,
    0,
  );
  return voteTotals || undefined;
};

export const polls_fromState = ({
  client,
  pollId,
  sources = [],
}: PollsFromStateParams): PollsFromStateResult | undefined => {
  const normalizedId = toStringMaybe(pollId);
  if (!normalizedId) return undefined;

  const candidates: PollCandidate[] = [];

  const clientPoll = pollFromClientStore(
    client as { polls?: { store?: StateStore<{ polls: unknown[] }> } } | undefined,
    normalizedId,
  );
  if (clientPoll) {
    const candidate = unwrapPollCandidate(clientPoll);
    if (candidate) candidates.push(candidate);
  }

  for (const source of sources) {
    if (!source) continue;
    const candidate = unwrapPollCandidate(source);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  if (!candidates.length) {
    return undefined;
  }

  const primaryWithStore = candidates.find((candidate) => candidate.store);
  const primary = primaryWithStore ?? candidates[0];

  const sourceRecords = collectCandidateSources(candidates);

  const optionsMap = collectOptionsMap(sourceRecords, normalizedId);
  const voteCounts = collectVoteCounts(sourceRecords);
  const latestVotes = collectLatestVotes(sourceRecords, normalizedId);
  const ownVotes = collectOwnVotes(sourceRecords, normalizedId);
  const maxIds = collectMaxIds(sourceRecords);

  for (const optionId of Object.keys(voteCounts)) {
    const option = ensureOption(optionsMap, optionId, normalizedId);
    option.vote_count = voteCounts[optionId];
  }
  for (const optionId of Object.keys(latestVotes)) {
    ensureOption(optionsMap, optionId, normalizedId);
  }
  for (const optionId of Object.keys(ownVotes)) {
    ensureOption(optionsMap, optionId, normalizedId);
  }

  const options = Array.from(optionsMap.values());

  const name = toStringMaybe(
    pickFirstFromSources(sourceRecords, 'name', 'poll_name'),
  );
  const question = toStringMaybe(
    pickFirstFromSources(sourceRecords, 'question', 'title'),
  );
  const text = toStringMaybe(pickFirstFromSources(sourceRecords, 'text'));
  const description = toStringMaybe(
    pickFirstFromSources(sourceRecords, 'description'),
  );
  const answersCount = toNumberMaybe(
    pickFirstFromSources(sourceRecords, 'answers_count'),
  );
  const voteCount = pickVoteCount(sourceRecords, voteCounts, latestVotes);
  const enforceUniqueVote = toBooleanMaybe(
    pickFirstFromSources(sourceRecords, 'enforce_unique_vote'),
  );
  const isClosed = toBooleanMaybe(
    pickFirstFromSources(sourceRecords, 'is_closed', 'closed'),
  );
  const maxVotesAllowed = toNumberMaybe(
    pickFirstFromSources(sourceRecords, 'max_votes_allowed'),
  );
  const votingVisibility = toVotingVisibilityValue(
    pickFirstFromSources(sourceRecords, 'voting_visibility', 'visibility'),
  );
  const ownAnswer = toPollAnswer(
    pickFirstFromSources(sourceRecords, 'ownAnswer', 'own_answer'),
    normalizedId,
  );
  const createdBy = toUserRecord(
    pickFirstFromSources(sourceRecords, 'created_by'),
  );
  const createdAt = toDateISOString(
    pickFirstFromSources(sourceRecords, 'created_at'),
  );
  const updatedAt = toDateISOString(
    pickFirstFromSources(sourceRecords, 'updated_at'),
  );

  const stateSnapshot: PollStateValue = {
    options,
    latest_votes_by_option: latestVotes,
    vote_counts_by_option: voteCounts,
    ownVotesByOptionId: ownVotes,
    maxVotedOptionIds: maxIds,
    vote_count: voteCount,
    answers_count: answersCount,
    ownAnswer,
    enforce_unique_vote: enforceUniqueVote,
    is_closed: isClosed,
    max_votes_allowed: maxVotesAllowed,
    voting_visibility: votingVisibility,
    name,
    question,
    text,
    description,
  };

  const store: PollStateStore =
    (primaryWithStore?.store as PollStateStore | undefined) ??
    new StateStore<PollStateValue>(stateSnapshot);

  const targetPoll: PollWithState = primaryWithStore?.poll
    ? (primaryWithStore.poll as PollWithState)
    : ({ ...(primary.poll as Record<string, unknown>), id: normalizedId } as PollWithState);

  targetPoll.id = normalizedId;
  if (name !== undefined) targetPoll.name = name;
  if (question !== undefined) targetPoll.question = question;
  if (text !== undefined) targetPoll.text = text;
  if (description !== undefined) targetPoll.description = description;
  if (createdAt !== undefined) targetPoll.created_at = createdAt;
  if (updatedAt !== undefined) targetPoll.updated_at = updatedAt;
  if (createdBy !== undefined) targetPoll.created_by = createdBy;
  targetPoll.options = options;
  targetPoll.latest_votes_by_option = latestVotes;
  targetPoll.vote_counts_by_option = voteCounts;
  targetPoll.ownVotesByOptionId = ownVotes;
  targetPoll.maxVotedOptionIds = maxIds;
  targetPoll.vote_count = voteCount;
  targetPoll.answers_count = answersCount;
  targetPoll.ownAnswer = ownAnswer;
  targetPoll.enforce_unique_vote = enforceUniqueVote;
  targetPoll.is_closed = isClosed;
  targetPoll.max_votes_allowed = maxVotesAllowed;
  targetPoll.voting_visibility = votingVisibility;
  targetPoll.state = store;

  return targetPoll as PollsFromStateResult;
};

const readPollStateSnapshot = (
  poll: QueryAnswersPoll,
): PollStateSnapshotLike | undefined => {
  const state = poll.state;
  if (!state) return undefined;
  if (isStateStore(state)) {
    const latest = state.getLatestValue?.();
    if (latest && isRecord(latest)) {
      return latest as PollStateSnapshotLike;
    }
    const snapshot = state.getState?.();
    if (snapshot && isRecord(snapshot)) {
      return snapshot as PollStateSnapshotLike;
    }
    return undefined;
  }
  if (isRecord(state)) {
    return state as PollStateSnapshotLike;
  }
  return undefined;
};

const appendAnswerCandidate = (
  target: unknown[],
  value: unknown,
): void => {
  if (value === undefined || value === null) {
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      appendAnswerCandidate(target, entry);
    }
    return;
  }
  if (isRecord(value) && Array.isArray(value.results)) {
    for (const entry of value.results) {
      appendAnswerCandidate(target, entry);
    }
    return;
  }
  target.push(value);
};

const appendAnswerCandidatesFromVotes = (
  target: unknown[],
  value: unknown,
): void => {
  if (!isRecord(value)) return;
  for (const entry of Object.values(value)) {
    if (Array.isArray(entry)) {
      for (const candidate of entry) {
        appendAnswerCandidate(target, candidate);
      }
    }
  }
};

const mergeAnswer = (
  registry: Map<string, PollAnswer>,
  candidate: PollAnswer,
): void => {
  const existing = registry.get(candidate.id);
  if (existing) {
    registry.set(candidate.id, { ...existing, ...candidate });
  } else {
    registry.set(candidate.id, candidate);
  }
};

const toSafeInteger = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 0 ? undefined : Math.floor(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return undefined;
};

const normalizeAnswers = (
  candidates: unknown[],
  pollId: string,
): PollAnswer[] => {
  const answers = new Map<string, PollAnswer>();
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const hasAnswerField =
      'answer_text' in candidate || 'is_answer' in candidate;
    if (!hasAnswerField) continue;
    const normalized = toPollAnswer(candidate, pollId);
    if (!normalized) continue;
    if (!normalized.answer_text && !('answer_text' in candidate)) continue;
    mergeAnswer(answers, normalized);
  }

  const result = Array.from(answers.values());
  result.sort((a, b) => {
    const timeA = Date.parse(a.created_at);
    const timeB = Date.parse(b.created_at);
    if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id);
  });
  return result;
};

export async function queryAnswers(
  poll: QueryAnswersPoll,
  params: QueryAnswersParams = {},
): Promise<QueryAnswersResult> {
  const pollId = toStringMaybe(poll.id);
  if (!pollId) {
    return { votes: [] };
  }

  const candidates: unknown[] = [];
  const stateSnapshot = readPollStateSnapshot(poll);

  appendAnswerCandidate(candidates, poll.answers);
  appendAnswerCandidate(candidates, poll.latest_answers);
  appendAnswerCandidate(candidates, poll.ownAnswer);
  appendAnswerCandidate(candidates, poll.own_answer);

  if (stateSnapshot) {
    appendAnswerCandidate(candidates, stateSnapshot.answers);
    appendAnswerCandidate(candidates, stateSnapshot.latest_answers);
    appendAnswerCandidate(candidates, stateSnapshot.ownAnswer);
    appendAnswerCandidate(candidates, stateSnapshot.own_answer);
  }

  appendAnswerCandidatesFromVotes(candidates, poll.latest_votes_by_option);
  if (stateSnapshot?.latest_votes_by_option) {
    appendAnswerCandidatesFromVotes(
      candidates,
      stateSnapshot.latest_votes_by_option,
    );
  }

  const answers = normalizeAnswers(candidates, pollId);

  if (!answers.length) {
    return { votes: [] };
  }

  const offset = toSafeInteger(params.next) ?? 0;
  const limit = toSafeInteger(params.limit);

  const start = offset < answers.length ? offset : answers.length;
  const end =
    limit !== undefined && limit > 0
      ? Math.min(start + limit, answers.length)
      : answers.length;

  const page = answers.slice(start, end);
  const next = end < answers.length ? String(end) : undefined;

  return { votes: page, next };
}

export const queryOptionVotes = async ({
  pollId,
  optionId,
  limit,
  cursor,
}: QueryOptionVotesParams): Promise<QueryOptionVotesResponse> => {
  const normalizedPollId = toStringMaybe(pollId);
  const normalizedOptionId = toStringMaybe(optionId);
  if (!normalizedPollId || !normalizedOptionId) {
    return { results: [] };
  }

  const searchParams = new URLSearchParams();
  const safeLimit = toSafeInteger(limit);
  if (safeLimit !== undefined) {
    searchParams.set('limit', String(safeLimit));
  }
  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  const query = searchParams.toString();
  const response = await authorizedFetch(
    `/api/polls/${encodeURIComponent(normalizedPollId)}/options/${encodeURIComponent(
      normalizedOptionId,
    )}/votes/${query ? `?${query}` : ""}`,
    { method: "GET" },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to query poll option votes (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error('Invalid query option votes response');
  }

  const rawResults = payload.results;
  if (!Array.isArray(rawResults)) {
    throw new Error('Invalid query option votes response');
  }

  const results: PollVote[] = [];
  for (const candidate of rawResults) {
    if (!isRecord(candidate)) {
      continue;
    }
    const normalized = toPollVote(
      candidate,
      normalizedPollId,
      normalizedOptionId,
    );
    if (normalized) {
      results.push(normalized);
    }
  }

  const responseData: QueryOptionVotesResponse = { results };

  if ('next' in payload) {
    const rawNext = payload.next;
    if (typeof rawNext === 'string' && rawNext) {
      responseData.next = rawNext;
    } else if (rawNext === null) {
      responseData.next = null;
    } else if (rawNext !== undefined) {
      throw new Error('Invalid query option votes response');
    }
  }

  if ('prev' in payload) {
    const rawPrev = payload.prev;
    if (typeof rawPrev === 'string' && rawPrev) {
      responseData.prev = rawPrev;
    } else if (rawPrev === null) {
      responseData.prev = null;
    } else if (rawPrev !== undefined) {
      throw new Error('Invalid query option votes response');
    }
  }

  if ('count' in payload) {
    const rawCount = payload.count;
    if (typeof rawCount === 'number' && Number.isFinite(rawCount)) {
      responseData.count = rawCount;
    } else if (rawCount !== undefined) {
      throw new Error('Invalid query option votes response');
    }
  }

  return responseData;
};

type ThreadsSubscriptionsClient = {
  threads?: { unregisterSubscriptions?: () => void };
};

export type ThreadsUnregisterSubscriptionsParams = {
  client?: ThreadsSubscriptionsClient | StreamChat | null;
};

const toThreadsSubscriptionsClient = (
  client: ThreadsUnregisterSubscriptionsParams['client'],
): ThreadsSubscriptionsClient | undefined => {
  if (!client) return undefined;
  if (typeof client === 'object') {
    return client as ThreadsSubscriptionsClient;
  }
  return undefined;
};

const threadsUnregisterSubscriptions = async ({
  client,
}: ThreadsUnregisterSubscriptionsParams = {}): Promise<void> => {
  const target = toThreadsSubscriptionsClient(client);
  target?.threads?.unregisterSubscriptions?.();
};

type PollsSubscriptionsClient = {
  polls?: { unregisterSubscriptions?: () => void };
};

export type PollsUnregisterSubscriptionsParams = {
  client?: PollsSubscriptionsClient | StreamChat | null;
};

const toPollsSubscriptionsClient = (
  client: PollsUnregisterSubscriptionsParams['client'],
): PollsSubscriptionsClient | undefined => {
  if (!client) return undefined;
  if (typeof client === 'object') {
    return client as PollsSubscriptionsClient;
  }
  return undefined;
};

const pollsUnregisterSubscriptions = async ({
  client,
}: PollsUnregisterSubscriptionsParams = {}): Promise<void> => {
  const target = toPollsSubscriptionsClient(client);
  target?.polls?.unregisterSubscriptions?.();
};

type RemindersTimerClient = {
  reminders?: { clearTimers?: () => void; initTimers?: () => void };
};

export type RemindersClearTimersParams = {
  client?: RemindersTimerClient | StreamChat | null;
};

export type RemindersInitTimersParams = {
  client?: RemindersTimerClient | StreamChat | null;
};

const toRemindersTimerClient = (
  client: RemindersClearTimersParams['client'],
): RemindersTimerClient | undefined => {
  if (!client) return undefined;
  if (typeof client === 'object') {
    return client as RemindersTimerClient;
  }
  return undefined;
};

const getDefaultRemindersTimerClient = (): RemindersTimerClient | undefined => {
  try {
    return getLocalClient() as RemindersTimerClient;
  } catch {
    return undefined;
  }
};

const remindersInitTimers = async (
  params: RemindersInitTimersParams = {},
): Promise<void> => {
  const client =
    toRemindersTimerClient(params.client) ?? getDefaultRemindersTimerClient();

  client?.reminders?.initTimers?.();
};

const remindersClearTimers = async (
  params: RemindersClearTimersParams = {},
): Promise<void> => {
  const client =
    toRemindersTimerClient(params.client) ?? getDefaultRemindersTimerClient();

  client?.reminders?.clearTimers?.();
  clearAllReminderTimers();
};

const DEFAULT_REMINDER_SCHEDULED_OFFSETS_MS: readonly number[] = Object.freeze([
  5 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
  24 * 60 * 60 * 1000,
]);

export type RemindersScheduledOffsetsMsParams = {
  client?: ReminderAwareClient | StreamChat;
};

const normalizeScheduledOffsets = (value: unknown): number[] | null => {
  if (!Array.isArray(value)) return null;

  const normalized: number[] = [];

  for (const entry of value) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      normalized.push(entry);
    }
  }

  return normalized.length ? normalized : null;
};

const remindersScheduledOffsetsMs = (
  params: RemindersScheduledOffsetsMsParams = {},
): number[] => {
  const manager =
    toReminderManager(params.client) ??
    toReminderManager(getDefaultRemindersClient());

  const normalized = normalizeScheduledOffsets(manager?.scheduledOffsetsMs);

  if (normalized) {
    return normalized.slice();
  }

  return [...DEFAULT_REMINDER_SCHEDULED_OFFSETS_MS];
};

const toPollVoteLike = (value: unknown): PollVoteLike | null => {
  if (!isRecord(value)) return null;
  const identifier = (value as { id?: unknown }).id;
  if (typeof identifier !== 'string' && typeof identifier !== 'number') {
    return null;
  }
  return value as PollVoteLike;
};

export type PollVoteCastedEvent = Event & {
  type: 'poll.vote_casted';
  poll_vote: PollVoteLike | null;
};

export type PollVoteChangedEvent = Event & {
  type: 'poll.vote_changed';
  poll_vote: PollVoteLike | null;
};

export type PollVoteRemovedEvent = Event & {
  type: 'poll.vote_removed';
  poll_vote: PollVoteLike | null;
};

const emptySubscription: ChannelEventSubscription = {
  unsubscribe: () => undefined,
};

export type StreamEventBase = {
  type: string;
  cid?: string | null;
  channel_id?: string | number | null;
  channel_type?: string | null;
  message?: Record<string, unknown> | null;
  channel?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type NormalizedFilter = {
  cid?: string;
  channelId?: string;
};

type ListenerRecord = {
  callback: (event: StreamEventBase) => void;
  filter: NormalizedFilter;
};

type EventEntry = {
  listeners: Set<ListenerRecord>;
  handler: ((event: StreamEventBase) => void) | null;
  subscription: ChannelEventSubscription | null;
};

type SubscriptionTarget = EventTargetLike & object;

const subscriptionRegistry = new WeakMap<SubscriptionTarget, Map<string, EventEntry>>();

const toStringIfPossible = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const channelIdFromCid = (cid?: string): string | undefined => {
  if (!cid) return undefined;
  const parts = cid.split(':');
  return parts.length > 1 ? parts.slice(1).join(':') : cid;
};

const extractCid = (event: StreamEventBase): string | undefined => {
  const direct = toStringIfPossible(event.cid);
  if (direct) return direct;

  const channelCid = toStringIfPossible(
    (event.channel as { cid?: unknown } | undefined | null)?.cid,
  );
  if (channelCid) return channelCid;

  const message = event.message as Record<string, unknown> | null | undefined;
  if (message && typeof message === 'object') {
    const messageCid = toStringIfPossible((message as { cid?: unknown }).cid);
    if (messageCid) return messageCid;

    const messageChannel = (message as { channel?: Record<string, unknown> | null }).channel;
    if (messageChannel && typeof messageChannel === 'object') {
      const nestedCid = toStringIfPossible(
        (messageChannel as { cid?: unknown }).cid,
      );
      if (nestedCid) return nestedCid;
    }
  }

  return undefined;
};

const extractChannelId = (
  event: StreamEventBase,
  fallbackCid?: string,
): string | undefined => {
  const direct = toStringIfPossible(event.channel_id);
  if (direct) return direct;

  const channel = event.channel as Record<string, unknown> | null | undefined;
  if (channel && typeof channel === 'object') {
    const id = toStringIfPossible((channel as { id?: unknown }).id);
    if (id) return id;
  }

  const message = event.message as Record<string, unknown> | null | undefined;
  if (message && typeof message === 'object') {
    const messageChannel = (message as { channel?: Record<string, unknown> | null }).channel;
    if (messageChannel && typeof messageChannel === 'object') {
      const nestedId = toStringIfPossible(
        (messageChannel as { id?: unknown }).id,
      );
      if (nestedId) return nestedId;
    }
  }

  return channelIdFromCid(fallbackCid);
};

const matchesCid = (actual: string | undefined, expected: string | undefined): boolean => {
  if (!expected) return true;
  if (!actual) return false;
  if (actual === expected) return true;

  const actualTail = channelIdFromCid(actual);
  if (actualTail && actualTail === expected) return true;

  const expectedTail = channelIdFromCid(expected);
  if (expectedTail && (expectedTail === actual || expectedTail === actualTail)) {
    return true;
  }

  if (actual.endsWith(`:${expected}`) || expected.endsWith(`:${actual}`)) {
    return true;
  }

  return false;
};

const matchesChannelId = (
  actual: string | undefined,
  expected: string | undefined,
  eventCid?: string,
): boolean => {
  if (!expected) return true;
  if (actual && actual === expected) return true;

  const actualTail = channelIdFromCid(actual);
  if (actualTail && actualTail === expected) return true;

  const cidTail = channelIdFromCid(eventCid);
  if (cidTail && cidTail === expected) return true;

  return false;
};

const matchesFilter = (event: StreamEventBase, filter: NormalizedFilter): boolean => {
  if (!filter.cid && !filter.channelId) {
    return true;
  }

  const eventCid = extractCid(event);
  if (filter.cid && !matchesCid(eventCid, filter.cid)) {
    return false;
  }

  if (filter.channelId) {
    const eventChannelId = extractChannelId(event, eventCid);
    if (!matchesChannelId(eventChannelId, filter.channelId, eventCid)) {
      return false;
    }
  }

  return true;
};

const ensureEventShape = (
  event: StreamEventBase | undefined,
  eventType: string,
): StreamEventBase => {
  if (event && typeof event === 'object') {
    if (typeof event.type === 'string' && event.type) {
      return event;
    }
    return { ...event, type: eventType };
  }
  return { type: eventType };
};

const getSubscriptionTarget = (
  candidate?: StreamChat | EventTargetLike | null,
): SubscriptionTarget | undefined => {
  if (candidate && typeof candidate === 'object') {
    const maybeTarget = candidate as EventTargetLike;
    if (typeof maybeTarget.on === 'function') {
      return candidate as SubscriptionTarget;
    }
  }

  try {
    const localClient = getLocalClient();
    if (
      localClient &&
      typeof localClient === 'object' &&
      typeof (localClient as EventTargetLike).on === 'function'
    ) {
      return localClient as SubscriptionTarget;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const getRegistryForTarget = (
  target: SubscriptionTarget,
): Map<string, EventEntry> => {
  let map = subscriptionRegistry.get(target);
  if (!map) {
    map = new Map();
    subscriptionRegistry.set(target, map);
  }
  return map;
};

const registerListener = (
  target: SubscriptionTarget,
  eventType: string,
  listener: (event: StreamEventBase) => void,
  filter: NormalizedFilter,
): (() => void) => {
  const map = getRegistryForTarget(target);
  let entry = map.get(eventType);
  if (!entry) {
    entry = { listeners: new Set(), handler: null, subscription: null };
    map.set(eventType, entry);
  }

  if (!entry.handler) {
    entry.handler = (rawEvent: StreamEventBase) => {
      const event = ensureEventShape(rawEvent, eventType);
      for (const record of entry!.listeners) {
        if (matchesFilter(event, record.filter)) {
          record.callback(event);
        }
      }
    };
  }

  if (!entry.subscription) {
    const handler = entry.handler as (...args: any[]) => void;
    entry.subscription = createSubscription(
      target as EventTargetLike,
      eventType,
      handler,
    );
  }

  const record: ListenerRecord = { callback: listener, filter };
  entry.listeners.add(record);

  let unsubscribed = false;
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;

    entry!.listeners.delete(record);
    if (entry!.listeners.size === 0) {
      entry!.subscription?.unsubscribe();
      entry!.subscription = null;
      entry!.handler = null;
      map.delete(eventType);
      if (map.size === 0) {
        subscriptionRegistry.delete(target);
      }
    }
  };
};

const normalizeString = (value: unknown): string | undefined => toStringIfPossible(value);

export type OnOptions = {
  client?: StreamChat | EventTargetLike | null;
  cid?: string | null;
  channelId?: string | number | null;
};

export function on<TEvent extends keyof ClientKnownEventMap>(
  eventOrEvents: TEvent | TEvent[],
  listener: (event: ClientKnownEventMap[TEvent]) => void,
  opts?: OnOptions,
): () => void;
export function on(
  eventOrEvents: string | string[],
  listener: (event: StreamEventBase) => void,
  opts?: OnOptions,
): () => void;
export function on(
  eventOrEvents: string | string[],
  listener: (event: StreamEventBase) => void,
  opts?: OnOptions,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const target = getSubscriptionTarget(opts?.client);
  if (!target) {
    return () => undefined;
  }

  const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
  const uniqueEvents = Array.from(
    new Set(
      events
        .map((event) => (typeof event === 'string' ? event.trim() : ''))
        .filter((event): event is string => event.length > 0),
    ),
  );

  if (uniqueEvents.length === 0) {
    return () => undefined;
  }

  const filter: NormalizedFilter = {
    cid: normalizeString(opts?.cid),
    channelId: normalizeString(opts?.channelId),
  };

  const unsubscribeHandlers = uniqueEvents.map((eventType) =>
    registerListener(target, eventType, listener as (event: StreamEventBase) => void, filter),
  );

  let unsubscribed = false;
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
    unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
  };
}

type VoteEventWithChannelMetadata =
  | ClientKnownEventMap['poll.vote_casted']
  | ClientKnownEventMap['poll.vote_changed']
  | ClientKnownEventMap['poll.vote_removed'];

const withChannelMetadata = (
  event: VoteEventWithChannelMetadata,
  channel?: Channel | null,
): Pick<PollVoteCastedEvent, 'cid' | 'channel_id' | 'channel_type'> => {
  const cid = typeof event.cid === 'string' && event.cid ? event.cid : channel?.cid;
  const channelId =
    typeof event.channel_id === 'string' && event.channel_id
      ? event.channel_id
      : typeof event.channel_id === 'number'
        ? String(event.channel_id)
        : channel?.id;
  const channelType =
    typeof event.channel_type === 'string' && event.channel_type
      ? event.channel_type
      : channel?.type;

  return {
    cid,
    channel_id: channelId,
    channel_type: channelType,
  };
};

export type OnPollVoteCastedParams = {
  channel?: Channel | null;
  handler: (event: PollVoteCastedEvent) => void;
};

export const onPollVoteCasted = ({
  channel,
  handler,
}: OnPollVoteCastedParams): ChannelEventSubscription => {
  if (!channel || typeof (channel as { on?: unknown }).on !== 'function') {
    return emptySubscription;
  }

  const subscription = createSubscription(
    channel as unknown as EventTargetLike,
    'poll.vote_casted',
    (event: any) => {
      const pollVote = toPollVoteLike((event as { poll_vote?: unknown }).poll_vote);
      const metadata = withChannelMetadata(event as Event, channel);
      const normalizedEvent: PollVoteCastedEvent = {
        ...(event as Event),
        ...metadata,
        type: 'poll.vote_casted',
        poll_vote: pollVote,
      };
      handler(normalizedEvent);
    },
  );

  return subscription ?? emptySubscription;
};

export type OnPollVoteRemovedParams = {
  channel?: Channel | null;
  cid?: string | null;
  client?: StreamChat | null;
  handler: (event: PollVoteRemovedEvent) => void;
};

export const onPollVoteRemoved = ({
  channel,
  cid,
  client,
  handler,
}: OnPollVoteRemovedParams): ChannelEventSubscription => {
  if (!client || typeof (client as { on?: unknown }).on !== 'function') {
    return emptySubscription;
  }

  const targetCid = cid ?? channel?.cid ?? null;

  const subscription = clientOnTyped(
    client,
    'poll.vote_removed',
    (event: ClientKnownEventMap['poll.vote_removed']) => {
      const eventCid =
        typeof event.cid === 'string' && event.cid ? event.cid : null;
      if (targetCid && eventCid && eventCid !== targetCid) {
        return;
      }

      const metadata = withChannelMetadata(event, channel);
      const normalizedCid =
        metadata.cid ?? eventCid ?? (targetCid ?? undefined);

      if (targetCid && normalizedCid && normalizedCid !== targetCid) {
        return;
      }

      const pollVote = toPollVoteLike(event.poll_vote);
      const normalizedEvent: PollVoteRemovedEvent = {
        ...(event as Event),
        ...metadata,
        cid: normalizedCid ?? undefined,
        type: 'poll.vote_removed',
        poll_vote: pollVote,
      };

      handler(normalizedEvent);
    },
  );

  return subscription ?? emptySubscription;
};

export type OnPollVoteChangedParams = {
  channel?: Channel | null;
  cid?: string | null;
  client?: StreamChat | null;
  handler: (event: PollVoteChangedEvent) => void;
};

export const onPollVoteChanged = ({
  channel,
  cid,
  client,
  handler,
}: OnPollVoteChangedParams): ChannelEventSubscription => {
  if (!client || typeof (client as { on?: unknown }).on !== 'function') {
    return emptySubscription;
  }

  const targetCid = cid ?? channel?.cid ?? null;

  const subscription = clientOnTyped(
    client,
    'poll.vote_changed',
    (event: ClientKnownEventMap['poll.vote_changed']) => {
      const eventCid =
        typeof event.cid === 'string' && event.cid ? event.cid : null;
      if (targetCid && eventCid && eventCid !== targetCid) {
        return;
      }

      const metadata = withChannelMetadata(event, channel);
      const normalizedCid =
        metadata.cid ?? eventCid ?? (targetCid ?? undefined);

      if (targetCid && normalizedCid && normalizedCid !== targetCid) {
        return;
      }

      const pollVote = toPollVoteLike(event.poll_vote);
      const normalizedEvent: PollVoteChangedEvent = {
        ...(event as Event),
        ...metadata,
        cid: normalizedCid ?? undefined,
        type: 'poll.vote_changed',
        poll_vote: pollVote,
      };

      handler(normalizedEvent);
    },
  );

  return subscription ?? emptySubscription;
};

type ChannelMarkUnreadLike = {
  markUnread?: (messageId: string) => Promise<unknown>;
};

export type MarkUnreadInput = {
  channel?: ChannelMarkUnreadLike | null;
  messageId: string | number;
};

export type ClientThreadsStateParams = {
  cid: string;
  limit?: number;
  before?: number;
};

export type ClientThreadsStateResponse = {
  threads: ThreadPreview[];
  unreadThreadCount: number;
  unseenThreadIds: string[];
  next: number | null;
};

export type LoadNextPageArgs = {
  cid?: string;
  parentId?: string;
  limit?: number;
  cursor?: string;
};

export type ThreadPage = {
  messages: ThreadMessage[];
  nextCursor?: string;
  hasMore: boolean;
};

type ChannelUserLike = { id?: string | number | null } & Record<string, unknown>;

type ChannelMessageLike = {
  cid?: string;
  id?: string | number;
  parent_id?: string | number | null;
  reply_count?: number;
  show_in_channel?: boolean;
  created_at?: string | Date | number | null;
  updated_at?: string | Date | number | null;
  type?: string | null;
  silent?: boolean | null;
  shadowed?: boolean | null;
  status?: string | null;
  deleted_at?: string | Date | null;
  user?: ChannelUserLike | null;
  user_id?: string | number | null;
} & Record<string, unknown>;

type ChannelStateLike = {
  messages?: ChannelMessageLike[];
  messagePagination?: { hasPrev?: boolean; hasNext?: boolean };
  loadMessageIntoState?: (
    message: ChannelMessageLike,
  ) => Promise<ChannelMessageLike>;
  read?: Record<string, unknown>;
  [key: string]: unknown;
};

type ChannelWithLocalState = {
  cid: string;
  state?: ChannelStateLike;
  stateStore?: { dispatch?: (patch: unknown) => void } | undefined;
  getClient?: () => unknown;
} & Record<string, unknown>;

export type ChannelCountUnreadParams = {
  channel: ChannelWithLocalState & {
    countUnread?: (lastRead?: Date) => number;
  };
  lastRead?: Date;
};

export type ChannelLastReadParams = {
  channel: {
    lastRead?: () => Date | undefined;
  };
};

export type ClientThreadsActivateInput = {
  client: { threads?: { activate?: () => void } };
};

export type ClientThreadsReloadInput = {
  client: { threads?: { reload?: () => Promise<unknown> } };
};

export async function addAnswer(input: AddAnswerInput): Promise<AddAnswer> {
  const { chatSDKShim } = await getChatSDKShimModule();
  return chatSDKShim.addAnswer(input);
}

export function clientThreadsActivate({
  client,
}: ClientThreadsActivateInput): void {
  client.threads?.activate?.();
}

export async function clientThreadsReload({
  client,
}: ClientThreadsReloadInput): Promise<void> {
  if (typeof client.threads?.reload !== 'function') {
    return;
  }

  await client.threads.reload();
}

const clientQueryChannels = async ({
  client,
  filters = {},
  sort = {},
  options = {},
}: ClientQueryChannelsParams): Promise<Channel[]> => {
  const { clientQueryChannels } = await getChatSDKShimModule();
  return clientQueryChannels(client, filters, sort, options);
};

function channelCountUnread({
  channel,
  lastRead,
}: ChannelCountUnreadParams): number {
  return computeChannelUnreadCount(channel, lastRead);
}

function lastRead({ channel }: ChannelLastReadParams): Date | undefined {
  return readLastRead(channel);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toNonNegativeInteger = (value: unknown): number | undefined => {
  if (!isFiniteNumber(value)) return undefined;
  const normalized = Math.trunc(value);
  return normalized >= 0 ? normalized : undefined;
};

const toTimestamp = (value: unknown): number | undefined => {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? undefined : time;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const toDateSafe = (value: unknown): Date | undefined => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
};

const toStringId = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const getClientUserId = (
  channel: ChannelWithLocalState & { getClient?: () => unknown },
): string | undefined => {
  if (typeof channel.getClient !== 'function') return undefined;
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

const findMessageByIdInList = (
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
  if (type === 'system' || type === 'error' || type === 'ephemeral') {
    return false;
  }

  const silent = (message as { silent?: unknown }).silent;
  if (silent === true) return false;

  const shadowed = (message as { shadowed?: unknown }).shadowed;
  if (shadowed === true) return false;

  const status = (message as { status?: unknown }).status;
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized === 'failed' || normalized === 'sending' || normalized === 'draft') {
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

const computeChannelUnreadCount = (
  channel: ChannelCountUnreadParams['channel'],
  lastRead?: Date,
): number => {
  if (typeof channel.countUnread === 'function') {
    const direct = channel.countUnread(lastRead);
    if (typeof direct === 'number' && Number.isFinite(direct)) {
      return direct;
    }
  }

  const state = channel.state as ChannelStateLike | undefined;
  const ownUserId = getClientUserId(channel);
  const ownReadState = getOwnReadState(state, ownUserId);

  if (ownReadState) {
    const stored = (ownReadState as { unread_messages?: unknown }).unread_messages;
    if (typeof stored === 'number' && Number.isFinite(stored)) {
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
    typeof (ownReadState as { last_read_message_id?: unknown }).last_read_message_id === 'string'
  ) {
    const knownMessage = findMessageByIdInList(
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
    typeof (ownReadState as { first_unread_message_id?: unknown }).first_unread_message_id === 'string'
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
};

const readLastRead = (
  channel: ChannelLastReadParams['channel'],
): Date | undefined => {
  if (typeof channel.lastRead === 'function') {
    return channel.lastRead();
  }
  return undefined;
};

const getMessageTimestampSafe = (message: LocalMessage): number => {
  const createdAt = toTimestamp((message as { created_at?: unknown }).created_at);
  if (createdAt !== undefined) return createdAt;

  const updatedAt = toTimestamp((message as { updated_at?: unknown }).updated_at);
  if (updatedAt !== undefined) return updatedAt;

  return 0;
};

const getMessageId = (message: LocalMessage): string | undefined => {
  const rawId = (message as { id?: unknown }).id;
  if (typeof rawId === "string" && rawId) {
    return rawId;
  }
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return String(rawId);
  }
  return undefined;
};

const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, " ");

const messageMatchesQuery = (message: LocalMessage, query: string): boolean => {
  if (!query) return false;

  const normalizedQuery = query.toLowerCase();
  const candidates: string[] = [];

  const pushCandidate = (candidate: unknown) => {
    if (typeof candidate !== "string") return;
    const trimmed = candidate.trim();
    if (!trimmed) return;
    candidates.push(trimmed.toLowerCase());
  };

  pushCandidate((message as { text?: unknown }).text);
  pushCandidate((message as { body?: unknown }).body);

  const htmlCandidate = (message as { html?: unknown }).html;
  if (typeof htmlCandidate === "string" && htmlCandidate.trim()) {
    pushCandidate(stripHtml(htmlCandidate));
  }

  const id = getMessageId(message);
  if (id) {
    candidates.push(id.toLowerCase());
  }

  if (candidates.length === 0) {
    return false;
  }

  return candidates.some((candidate) => candidate.includes(normalizedQuery));
};

type ChannelForSearch = {
  cid?: string;
  state?: {
    messages?: LocalMessage[];
  };
};

type SearchableChannel = {
  cid: string;
  channel: ChannelForSearch;
};

const ensureChannelCid = (cid: string | undefined, fallback: string): string =>
  typeof cid === "string" && cid ? cid : fallback;

const normalizeMessageForChannel = (
  message: LocalMessage,
  cid: string,
): LocalMessage => {
  if (
    message &&
    typeof message === "object" &&
    typeof (message as { cid?: unknown }).cid === "string" &&
    (message as { cid?: string }).cid
  ) {
    return message;
  }

  if (message && typeof message === "object") {
    return { ...(message as Record<string, unknown>), cid } as LocalMessage;
  }

  return message;
};

const collectSearchableChannels = (): SearchableChannel[] => {
  const client = getLocalClient();
  const aggregated = new Map<string, ChannelForSearch>();

  const mergeChannel = (key: string, value: unknown) => {
    if (!value || typeof value !== "object") return;
    const candidate = value as ChannelForSearch;
    const resolvedCid = ensureChannelCid(candidate.cid, key);
    if (!aggregated.has(resolvedCid)) {
      aggregated.set(resolvedCid, candidate);
    }
  };

  const active = (client as { activeChannels?: Record<string, unknown> })?.activeChannels;
  if (active && typeof active === "object") {
    for (const [cid, channel] of Object.entries(active)) {
      mergeChannel(cid, channel);
    }
  }

  const stateChannels = (client as { state?: { channels?: Map<string, unknown> } })?.state?.channels;
  if (stateChannels instanceof Map) {
    for (const [cid, channel] of stateChannels.entries()) {
      mergeChannel(cid, channel);
    }
  }

  return Array.from(aggregated.entries()).map(([cid, channel]) => ({
    cid,
    channel,
  }));
};

const isDeletedMessage = (message: LocalMessage): boolean => {
  const type = (message as { type?: unknown }).type;
  if (type === "deleted") return true;

  const deletedAt = (message as { deleted_at?: unknown }).deleted_at;
  if (deletedAt === null || deletedAt === undefined) return false;
  if (deletedAt instanceof Date) {
    return !Number.isNaN(deletedAt.getTime());
  }
  if (typeof deletedAt === "string") {
    return deletedAt.trim().length > 0;
  }
  return Boolean(deletedAt);
};

const collectMatchingMessages = (
  channels: SearchableChannel[],
  query: string,
): LocalMessage[] => {
  const seen = new Set<string>();
  const results: Array<{ message: LocalMessage; timestamp: number }> = [];
  let anonymousIndex = 0;

  for (const { cid, channel } of channels) {
    const messages = Array.isArray(channel.state?.messages)
      ? (channel.state?.messages as LocalMessage[])
      : [];

    for (const rawMessage of messages) {
      if (!rawMessage) continue;
      const candidate = normalizeMessageForChannel(rawMessage, cid);
      if (isDeletedMessage(candidate)) continue;
      if (!messageMatchesQuery(candidate, query)) continue;

      const key = getMessageId(candidate) ?? `__${cid}_${anonymousIndex}`;
      anonymousIndex += 1;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        message: candidate,
        timestamp: getMessageTimestampSafe(candidate),
      });
    }
  }

  results.sort((a, b) => b.timestamp - a.timestamp);
  return results.map((entry) => entry.message);
};

export type ChannelWatcher = {
  user_id?: string | number | null;
  user?: Record<string, unknown> | null;
  [key: string]: unknown;
};

const parseChannelMessages = (value: unknown): Message[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is Message => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<Message>;
    return (
      typeof candidate.id === "number" &&
      typeof candidate.body === "string" &&
      typeof candidate.sent_by === "string" &&
      typeof candidate.created_at === "string"
    );
  });
};

const parseChannelWatchers = (value: unknown): ChannelWatcher[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((candidate): candidate is ChannelWatcher => {
    if (!isRecord(candidate)) return false;

    const { user_id, user } = candidate as ChannelWatcher;

    const isValidUserId =
      user_id === undefined ||
      user_id === null ||
      typeof user_id === "string" ||
      (typeof user_id === "number" && Number.isFinite(user_id));

    const isValidUserRecord =
      user === undefined || user === null || isRecord(user);

    return isValidUserId && isValidUserRecord;
  });
};

export type QueryChannelWatchersRequest = {
  cid: string;
  limit?: number;
  offset?: number;
};

export type QueryChannelWatchersResponse = {
  members: ChannelWatcher[];
};

export const queryChannelWatchers = async ({
  cid,
  limit,
  offset,
}: QueryChannelWatchersRequest): Promise<QueryChannelWatchersResponse> => {
  const params = new URLSearchParams();

  if (isFiniteNumber(limit)) {
    params.set("limit", String(limit));
  }

  if (isFiniteNumber(offset)) {
    params.set("offset", String(offset));
  }

  const query = params.toString();

  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/members/${query ? `?${query}` : ""}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to query channel members (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;
  const membersSource = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.members)
      ? data.members
      : [];

  return { members: parseChannelWatchers(membersSource) };
};

export const channelQuery = async ({
  cid,
  limit,
  before,
}: ChannelQueryRequest): Promise<ChannelQueryResponse> => {
  const params = new URLSearchParams();
  if (isFiniteNumber(limit)) {
    params.set("limit", String(limit));
  }
  if (isFiniteNumber(before)) {
    params.set("before", String(before));
  }

  const query = params.toString();

  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${query ? `?${query}` : ""}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to query channel messages (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as
    | { messages?: unknown; next?: unknown }
    | undefined;

  const messages = parseChannelMessages(data?.messages);
  const rawNext = data?.next;
  const next = typeof rawNext === "number" ? rawNext : null;

  return { messages, next };
};

const searchLocal = ({
  query,
  cid,
  limit,
  offset,
}: {
  query: string;
  cid?: string;
  limit?: number;
  offset?: number | string;
}): SearchResponse => {
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery) {
    return { messages: [] };
  }

  const normalizedCid = typeof cid === "string" ? cid.trim() : undefined;
  const availableChannels = collectSearchableChannels();
  const targets = normalizedCid
    ? availableChannels.filter((context) => context.cid === normalizedCid)
    : availableChannels;

  if (!targets.length) {
    return { messages: [] };
  }

  const matches = collectMatchingMessages(targets, normalizedQuery);
  if (!matches.length) {
    return { messages: [] };
  }

  const safeOffset = toNonNegativeInteger(offset) ?? 0;
  const safeLimit = toNonNegativeInteger(limit);

  if (safeLimit === 0) {
    const next = safeOffset < matches.length ? String(safeOffset) : undefined;
    return { messages: [], next };
  }

  const start = Math.min(safeOffset, matches.length);
  const end =
    safeLimit !== undefined
      ? Math.min(start + safeLimit, matches.length)
      : matches.length;

  const page = matches.slice(start, end);
  const next = end < matches.length ? String(end) : undefined;

  return { messages: page, next };
};

const parseServerSearchResults = (input: unknown): LocalMessage[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const results: LocalMessage[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;

    const id = candidate.id;
    if (id === undefined || id === null) continue;

    const createdAt = candidate.created_at;
    if (typeof createdAt !== "string" || !createdAt.trim()) continue;

    const cid = candidate.cid;
    if (typeof cid !== "string" || !cid.trim()) continue;

    const textValue = candidate.text;
    const normalizedText =
      typeof textValue === "string"
        ? textValue
        : typeof candidate.body === "string"
          ? (candidate.body as string)
          : "";

    const userId = candidate.user_id;
    const normalizedUserId =
      typeof userId === "string" || typeof userId === "number"
        ? userId
        : undefined;

    const message: Record<string, unknown> = {
      id,
      text: normalizedText,
      body: normalizedText,
      cid,
      created_at: createdAt,
    };

    if (normalizedUserId !== undefined) {
      message.user_id = normalizedUserId;
      message.user = { id: normalizedUserId };
    }

    results.push(message as LocalMessage);
  }

  return results;
};

export const search = async ({
  q,
  cid,
  limit,
  offset,
}: SearchRequest): Promise<SearchResponse> => {
  const trimmedQuery = typeof q === "string" ? q.trim() : "";
  if (trimmedQuery.length < 2) {
    return { messages: [] };
  }

  const normalizedCid = typeof cid === "string" ? cid.trim() : undefined;
  const limitNumber = toNonNegativeInteger(limit);

  const params = new URLSearchParams();
  params.set("q", trimmedQuery);
  if (normalizedCid) {
    params.set("cid", normalizedCid);
  }
  if (limitNumber !== undefined) {
    params.set("limit", String(limitNumber));
  }
  if (typeof offset === "string" && offset) {
    params.set("before", offset);
  }

  const queryString = params.toString();
  const response = await authorizedFetch(
    `/search/messages/${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      credentials: "same-origin",
    },
  );

  if (response.status === 501) {
    return searchLocal({
      query: trimmedQuery,
      cid: normalizedCid,
      limit: limitNumber,
      offset,
    });
  }

  if (!response.ok) {
    const error = new Error(
      `Failed to search messages (status ${response.status})`,
    );
    (error as ErrorWithStatus).status = response.status;
    throw error;
  }

  const payload = (await response.json()) as {
    results?: unknown;
    next?: unknown;
  } | null;

  const messages = parseServerSearchResults(payload?.results);
  const nextCursor =
    typeof payload?.next === "string" && payload.next.trim()
      ? payload.next
      : undefined;

  return { messages, next: nextCursor };
};

const toThreadPreviewMessage = (message: Message): ThreadPreviewMessage => {
  const text =
    typeof message.text === "string" && message.text.trim()
      ? message.text
      : message.body;

  const deletedAt = message.deleted_at;
  let normalizedDeleted: string | null = null;
  if (typeof deletedAt === "string") {
    normalizedDeleted = deletedAt;
  } else if (deletedAt instanceof Date) {
    normalizedDeleted = deletedAt.toISOString();
  }

  return {
    id: String(message.id),
    text,
    created_at: message.created_at,
    deleted_at: normalizedDeleted,
    sent_by: message.sent_by,
  };
};

export const clientThreadsState = async ({
  cid,
  limit,
  before,
}: ClientThreadsStateParams): Promise<ClientThreadsStateResponse> => {
  const { messages, next } = await channelQuery({ cid, limit, before });

  const threads = messages.map((message) => {
    const preview = toThreadPreviewMessage(message);
    return {
      id: preview.id,
      parent: preview,
      replies: [preview],
    } satisfies ThreadPreview;
  });

  return {
    threads,
    unreadThreadCount: 0,
    unseenThreadIds: [],
    next,
  };
};

type ChannelMembershipRecord = Record<string, unknown>;

type ChannelStateStoreLike = {
  dispatch?: (patch: Record<string, unknown>) => void;
};

type ChannelUnpinChannel = {
  state?: Record<string, unknown> | null;
  stateStore?: ChannelStateStoreLike | null;
  getClient?: () => { user?: { id?: string | number | null } | null } | null;
  unpin?: () => Promise<unknown>;
};

export type ChannelUnpinParams = { channel: ChannelUnpinChannel | undefined };

export type ChannelUnpinResult = { pinned: false; at: string };

export interface RoomDraft {
  id?: number;
  text?: string;
  body?: string;
  created_at?: string;
  updated_at?: string;
  [k: string]: unknown;
}

interface ErrorWithStatus extends Error {
  status?: number;
}

const normalizeUserId = (value: unknown): string | undefined => {
  if (typeof value === "string" && value) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const toUnpinnedMembership = (
  membership: ChannelMembershipRecord | undefined,
): ChannelMembershipRecord => {
  const next: ChannelMembershipRecord = { ...(membership ?? {}) };

  next.pinned = false;
  next.pinned_at = null;

  if ("pin_expires" in next) {
    next.pin_expires = null;
  }
  if ("pinned_by" in next) {
    next.pinned_by = null;
  }

  return next;
};

const applyChannelUnpinLocally = (channel: ChannelUnpinChannel): void => {
  const state = channel.state;
  if (!isRecord(state)) {
    return;
  }

  const rawMembership = state.membership;
  const nextMembership = toUnpinnedMembership(
    isRecord(rawMembership) ? (rawMembership as ChannelMembershipRecord) : undefined,
  );

  (state as Record<string, unknown>).membership = nextMembership;

  const patch: Record<string, unknown> = { membership: nextMembership };

  const rawMembers = state.members;
  if (isRecord(rawMembers)) {
    const client = typeof channel.getClient === "function" ? channel.getClient() : undefined;
    const ownUserId = normalizeUserId(client?.user?.id);

    if (ownUserId) {
      const rawMember = rawMembers[ownUserId];
      if (isRecord(rawMember)) {
        const nextMember = toUnpinnedMembership(rawMember as ChannelMembershipRecord);
        (rawMembers as Record<string, unknown>)[ownUserId] = nextMember;
        patch.members = { ...(rawMembers as Record<string, unknown>) };
      }
    }
  }

  const store = channel.stateStore;
  if (store && typeof store.dispatch === "function") {
    store.dispatch(patch);
  }
};

const extractUnpinAt = (result: unknown, fallback: string): string => {
  if (isRecord(result)) {
    const at = result.at;
    if (typeof at === "string") {
      return at;
    }
    const pinnedAt = result.pinned_at;
    if (typeof pinnedAt === "string") {
      return pinnedAt;
    }
  }
  return fallback;
};

const channelUnpin = async ({ channel }: ChannelUnpinParams): Promise<ChannelUnpinResult> => {
  const fallbackAt = new Date().toISOString();

  if (!channel) {
    return { pinned: false as const, at: fallbackAt };
  }

  const result =
    typeof channel.unpin === "function" ? await channel.unpin() : undefined;

  applyChannelUnpinLocally(channel);

  const at = extractUnpinAt(result, fallbackAt);

  return { pinned: false as const, at };
};

const cloneRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return { ...value };
};

const normalizePinExpiresForMembership = (
  value: unknown,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : value.toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return trimmed;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
  }

  return undefined;
};

const toPinnedMembership = (
  membership: ChannelMembershipRecord | undefined,
  pinnedAt: Date,
  pinnedBy: Record<string, unknown> | undefined,
  pinExpires: string | null | undefined,
): ChannelMembershipRecord => {
  const next: ChannelMembershipRecord = { ...(membership ?? {}) };

  next.pinned = true;
  next.pinned_at = pinnedAt.toISOString();

  if (pinExpires !== undefined) {
    next.pin_expires = pinExpires;
  }

  if (pinnedBy) {
    next.pinned_by = { ...pinnedBy };
  }

  return next;
};

const applyChannelPinLocally = (
  channel: ChannelUnpinChannel,
  pinnedAt: Date,
  pinnedBy: Record<string, unknown> | undefined,
  pinExpires: string | null | undefined,
): void => {
  const state = channel.state;
  if (!isRecord(state)) {
    return;
  }

  const rawMembership = state.membership;
  const nextMembership = toPinnedMembership(
    isRecord(rawMembership) ? (rawMembership as ChannelMembershipRecord) : undefined,
    pinnedAt,
    pinnedBy,
    pinExpires,
  );

  (state as Record<string, unknown>).membership = nextMembership;

  const patch: Record<string, unknown> = { membership: nextMembership };

  const rawMembers = state.members;
  if (isRecord(rawMembers)) {
    const client = typeof channel.getClient === "function" ? channel.getClient() : undefined;
    const ownUserId = normalizeUserId(client?.user?.id);

    if (ownUserId) {
      const rawMember = rawMembers[ownUserId];
      if (isRecord(rawMember)) {
        const nextMember = toPinnedMembership(
          rawMember as ChannelMembershipRecord,
          pinnedAt,
          pinnedBy,
          pinExpires,
        );
        (rawMembers as Record<string, unknown>)[ownUserId] = nextMember;
        patch.members = { ...(rawMembers as Record<string, unknown>) };
      }
    }
  }

  const store = channel.stateStore;
  if (store && typeof store.dispatch === "function") {
    store.dispatch(patch);
  }
};

type ReactionUserLike = ReactionUser;

type ReactionResponseLike = {
  type?: string;
  user?: ReactionUserLike | null;
  user_id?: string | number | null;
  score?: number | string | null;
  message_id?: string | number | null;
  [key: string]: unknown;
};

type QueryReactionsShimParams = {
  limit?: number;
  next?: string;
  reaction_type?: string;
  sort?: Record<string, number>;
};

type QueryReactionsShimMessage = {
  id?: string | number | null;
  queryReactions?: (params?: QueryReactionsShimParams) => Promise<unknown>;
} & Record<string, unknown>;

type ClientWithQueryReactions = {
  queryReactions?: (
    messageId: string,
    filter?: Record<string, unknown>,
    sort?: ReactionSort,
    options?: { limit?: number; next?: string },
  ) => Promise<unknown>;
};

export type QueryReactionsParams = {
  client?: (StreamChat & ClientWithQueryReactions) | ClientWithQueryReactions | null;
  message?: (LocalMessage & QueryReactionsShimMessage) | QueryReactionsShimMessage | null;
  messageId?: string | number | null;
  limit?: number;
  next?: string;
  reactionType?: string;
  sort?: ReactionSort;
};

export type QueryReactionsResult = {
  reactions: ReactionResponse[];
  next?: string;
};

type ReactionCountsRecord = Record<string, number>;

type ReactionScoresRecord = Record<string, number>;

type ReactionGroupRecord = {
  count?: number | string | null;
  sum_scores?: number | string | null;
  [key: string]: unknown;
};

export type ReactionUser = { id?: string | number | null } & Record<string, unknown>;

type ChannelReactionLike = {
  cid?: string;
  state?: { messages?: Array<Record<string, unknown>> | undefined } | null;
  stateStore?: ChannelStateStoreLike | null;
  getClient?: () => { user?: { id?: string | number | null } | null } | null;
  emit?: (event: string, payload: Record<string, unknown>) => void;
};

type ChannelPinLike = ChannelReactionLike & {
  state?: (
    | ({ pinnedMessages?: Array<Record<string, unknown>> | undefined } & Record<string, unknown>)
    | null
  );
  pin?: (message?: Record<string, unknown> | string) => Promise<unknown>;
};

export type SendReactionParams = {
  channel?: ChannelReactionLike | null;
  cid?: string;
  messageId: string | number;
  type: string;
  message?: Record<string, unknown> | LocalMessage | null;
  user?: ReactionUser | null;
  userId?: string | number | null;
  score?: number | null;
  now?: Date;
};

export type SendReactionResult = { message: Record<string, unknown> };

export type DeleteReactionParams = {
  channel?: ChannelReactionLike | null;
  cid?: string;
  messageId: string | number;
  type: string;
  message?: Record<string, unknown> | null;
  userId?: string | number | null;
};

export type DeleteReactionResult = { message: Record<string, unknown> };

export type PinMessageParams = {
  channel?: ChannelPinLike | null;
  cid?: string | null;
  messageId: string | number;
  message?: Record<string, unknown> | null;
  pinExpires?: string | Date | number | null;
  user?: Record<string, unknown> | null;
  now?: Date;
};

export type PinMessageResult = {
  pinned: true;
  at: string;
  message: Record<string, unknown>;
};

export type UnpinMessageParams = {
  channel?: ChannelPinLike | null;
  cid?: string | null;
  messageId: string | number;
  message?: Record<string, unknown> | null;
  now?: Date;
};

export type UnpinMessageResult = {
  pinned: false;
  at: string;
  message: Record<string, unknown>;
};

const normalizeMessageId = (value: unknown): string | undefined => {
  if (typeof value === "string" && value) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const getMessageLikeId = (
  message: MessageLikeWithId | null | undefined,
): string | undefined => {
  if (!message || typeof message !== "object") {
    return undefined;
  }

  return normalizeMessageId(message.id);
};

const markUnread = async ({
  channel,
  messageId,
}: MarkUnreadInput): Promise<unknown> => {
  const normalizedId = normalizeMessageId(messageId);

  if (!normalizedId) {
    throw new Error("Invalid message id provided to markUnread");
  }

  if (!channel) {
    return undefined;
  }

  const { chatSDKShim } = await getChatSDKShimModule();
  return chatSDKShim.markUnread(channel, normalizedId);
};

const getMessageLikeUserId = (
  message: MessageLikeWithId | null | undefined,
): string | undefined => {
  if (!message || typeof message !== "object") {
    return undefined;
  }

  const record = message as MessageLikeWithId;

  return (
    normalizeUserId(record.user_id) ??
    (record.user && typeof record.user === "object"
      ? normalizeUserId(record.user.id)
      : undefined)
  );
};

async function flagMessage({
  message,
  messageId,
  userId,
}: FlagMessageParams): Promise<FlagMessageResult> {
  const resolvedId =
    normalizeMessageId(messageId) ?? getMessageLikeId(message);

  if (!resolvedId) {
    throw new Error("Invalid message id provided to flagMessage");
  }

  const flaggedAt = new Date().toISOString();

  const result: FlagMessageResult = {
    flagged: true,
    message_id: resolvedId,
    flagged_at: flaggedAt,
  };

  const resolvedUserId =
    normalizeUserId(userId) ?? getMessageLikeUserId(message);

  if (resolvedUserId) {
    result.flagged_by = resolvedUserId;
  }

  return result;
}

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

const toReactionList = (value: unknown): ReactionResponseLike[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is ReactionResponseLike => Boolean(item) && typeof item === "object")
    .map((item) => ({ ...(item as ReactionResponseLike) }));
};

const hasQueryReactions = (
  client?: ClientWithQueryReactions | null,
): client is ClientWithQueryReactions & { queryReactions: Required<ClientWithQueryReactions>['queryReactions'] } =>
  Boolean(client && typeof client.queryReactions === "function");

const toReactionSortRecord = (
  sort?: ReactionSort,
): Record<string, number> | undefined => {
  if (!sort || typeof sort !== "object") {
    return undefined;
  }

  const result: Record<string, number> = {};

  for (const [field, direction] of Object.entries(sort as Record<string, unknown>)) {
    if (typeof direction === "number" && Number.isFinite(direction)) {
      if (direction > 0) {
        result[field] = 1;
      } else if (direction < 0) {
        result[field] = -1;
      }
      continue;
    }

    if (typeof direction === "string") {
      const normalized = direction.trim().toLowerCase();
      if (normalized === "asc" || normalized === "ascending") {
        result[field] = 1;
      } else if (normalized === "desc" || normalized === "descending") {
        result[field] = -1;
      }
    }
  }

  return Object.keys(result).length ? result : undefined;
};

const toQueryReactionsResult = (value: unknown): QueryReactionsResult | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as { reactions?: unknown; next?: unknown };
  const reactions = toReactionList(record.reactions) as ReactionResponse[];
  const nextValue = typeof record.next === "string" && record.next ? record.next : undefined;

  return { reactions, next: nextValue };
};

const cloneReactionUser = (
  user: ReactionUserLike | null | undefined,
): ReactionUserLike | undefined => {
  if (!user || typeof user !== "object") {
    return undefined;
  }
  return { ...user };
};

const removeFirstReaction = (
  list: ReactionResponseLike[],
  type: string,
  userId?: string,
): { list: ReactionResponseLike[]; removed?: ReactionResponseLike } => {
  const next: ReactionResponseLike[] = [];
  let removed: ReactionResponseLike | undefined;
  let consumed = false;

  for (const reaction of list) {
    if (!consumed) {
      const reactionType = typeof reaction.type === "string" ? reaction.type : undefined;
      if (reactionType === type) {
        const candidateUserId =
          normalizeUserId(reaction.user_id) ??
          normalizeUserId((reaction.user as ReactionUserLike | undefined)?.id);
        if (!userId || !candidateUserId || candidateUserId === userId) {
          removed = reaction;
          consumed = true;
          continue;
        }
      }
    }
    next.push(reaction);
  }

  return { list: consumed ? next : list, removed };
};

const addReactionToList = (
  list: ReactionResponseLike[],
  reaction: ReactionResponseLike,
): ReactionResponseLike[] => {
  const reactionType = typeof reaction.type === "string" ? reaction.type : undefined;
  const reactionUserId =
    normalizeUserId(reaction.user_id) ??
    normalizeUserId((reaction.user as ReactionUserLike | undefined)?.id);

  const next: ReactionResponseLike[] = [];
  for (const existing of list) {
    if (
      reactionType &&
      reactionUserId &&
      typeof existing.type === "string" &&
      existing.type === reactionType
    ) {
      const existingUserId =
        normalizeUserId(existing.user_id) ??
        normalizeUserId((existing.user as ReactionUserLike | undefined)?.id);
      if (existingUserId === reactionUserId) {
        continue;
      }
    }

    next.push(existing);
  }

  next.unshift({ ...reaction });

  return next;
};

const incrementReactionCounts = (
  countsSource: unknown,
  type: string,
): { next: ReactionCountsRecord; changed: boolean } => {
  const base = isRecord(countsSource)
    ? ({ ...(countsSource as ReactionCountsRecord) } as ReactionCountsRecord)
    : ({} as ReactionCountsRecord);
  const current = isRecord(countsSource)
    ? toFiniteNumber((countsSource as ReactionCountsRecord)[type]) ?? 0
    : 0;

  base[type] = current + 1;

  return { next: base, changed: true };
};

const incrementReactionScores = (
  scoresSource: unknown,
  type: string,
  score: number,
): { next: ReactionScoresRecord; changed: boolean } => {
  const base = isRecord(scoresSource)
    ? ({ ...(scoresSource as ReactionScoresRecord) } as ReactionScoresRecord)
    : ({} as ReactionScoresRecord);
  const current = isRecord(scoresSource)
    ? toFiniteNumber((scoresSource as ReactionScoresRecord)[type]) ?? 0
    : 0;

  base[type] = current + score;

  return { next: base, changed: true };
};

const incrementReactionGroups = (
  groupsSource: unknown,
  type: string,
  score: number,
  timestamp: string,
): { next: Record<string, ReactionGroupRecord>; changed: boolean } => {
  const record = isRecord(groupsSource)
    ? (groupsSource as Record<string, unknown>)
    : undefined;

  const nextGroups: Record<string, ReactionGroupRecord> = record
    ? { ...(record as Record<string, ReactionGroupRecord>) }
    : {};

  const rawGroup = record && isRecord(record[type])
    ? (record[type] as ReactionGroupRecord)
    : undefined;

  const currentCount = rawGroup ? toFiniteNumber(rawGroup.count) ?? 0 : 0;
  const nextGroup: ReactionGroupRecord = rawGroup
    ? { ...(rawGroup as ReactionGroupRecord) }
    : {};

  const nextCount = currentCount + 1;
  nextGroup.count = nextCount;

  if (
    !("first_reaction_at" in nextGroup) ||
    typeof (nextGroup as { first_reaction_at?: unknown }).first_reaction_at !== "string"
  ) {
    nextGroup.first_reaction_at = timestamp;
  }
  nextGroup.last_reaction_at = timestamp;

  const currentSum = rawGroup && rawGroup.sum_scores !== undefined
    ? toFiniteNumber(rawGroup.sum_scores)
    : null;
  const sumBase = currentSum ?? currentCount;
  const nextSum = sumBase + score;
  if (Number.isFinite(nextSum)) {
    nextGroup.sum_scores = nextSum;
  }

  nextGroups[type] = nextGroup;

  return { next: nextGroups, changed: true };
};

const updateReactionCounts = (
  countsSource: unknown,
  type: string,
): { next?: ReactionCountsRecord; changed: boolean } => {
  if (!isRecord(countsSource)) {
    return { next: undefined, changed: false };
  }

  const record = countsSource as Record<string, unknown>;
  if (!(type in record)) {
    return { next: countsSource as ReactionCountsRecord, changed: false };
  }

  const current = toFiniteNumber(record[type]);
  if (current === undefined) {
    return { next: countsSource as ReactionCountsRecord, changed: false };
  }

  const next: ReactionCountsRecord = {
    ...(record as ReactionCountsRecord),
  };

  const nextValue = current - 1;
  if (nextValue > 0) {
    next[type] = nextValue;
  } else {
    delete next[type];
  }

  return { next: Object.keys(next).length ? next : undefined, changed: true };
};

const updateReactionScores = (
  scoresSource: unknown,
  type: string,
  score: number,
): { next?: ReactionScoresRecord; changed: boolean } => {
  if (!isRecord(scoresSource)) {
    return { next: undefined, changed: false };
  }

  const record = scoresSource as Record<string, unknown>;
  if (!(type in record)) {
    return { next: scoresSource as ReactionScoresRecord, changed: false };
  }

  const current = toFiniteNumber(record[type]);
  if (current === undefined) {
    return { next: scoresSource as ReactionScoresRecord, changed: false };
  }

  const next: ReactionScoresRecord = {
    ...(record as ReactionScoresRecord),
  };

  const nextValue = current - score;
  if (nextValue > 0) {
    next[type] = nextValue;
  } else {
    delete next[type];
  }

  return { next: Object.keys(next).length ? next : undefined, changed: true };
};

const updateReactionGroups = (
  groupsSource: unknown,
  type: string,
  score: number,
): { next?: Record<string, ReactionGroupRecord>; changed: boolean } => {
  if (!isRecord(groupsSource)) {
    return { next: undefined, changed: false };
  }

  const record = groupsSource as Record<string, unknown>;
  const rawGroup = record[type];
  if (!isRecord(rawGroup)) {
    return { next: groupsSource as Record<string, ReactionGroupRecord>, changed: false };
  }

  const currentCount = toFiniteNumber((rawGroup as ReactionGroupRecord).count) ?? 0;
  const nextGroups: Record<string, ReactionGroupRecord> = {
    ...(record as Record<string, ReactionGroupRecord>),
  };

  const nextCount = currentCount - 1;
  if (nextCount > 0) {
    const nextGroup: ReactionGroupRecord = { ...(rawGroup as ReactionGroupRecord) };
    nextGroup.count = nextCount;

    const currentSum = toFiniteNumber((rawGroup as ReactionGroupRecord).sum_scores) ?? currentCount;
    const nextSum = currentSum - score;
    if (typeof nextSum === "number" && Number.isFinite(nextSum)) {
      nextGroup.sum_scores = nextSum;
    } else if ("sum_scores" in nextGroup) {
      delete nextGroup.sum_scores;
    }

    nextGroups[type] = nextGroup;
  } else {
    delete nextGroups[type];
  }

  return { next: Object.keys(nextGroups).length ? nextGroups : undefined, changed: true };
};

const getReactionScore = (reaction: ReactionResponseLike | undefined): number => {
  if (!reaction) {
    return 1;
  }
  const score = toFiniteNumber(reaction.score);
  return score ?? 1;
};

const findMessageById = (
  channel: ChannelReactionLike | null | undefined,
  messageId: string,
): Record<string, unknown> | undefined => {
  const state = channel?.state;
  if (!isRecord(state)) {
    return undefined;
  }
  const messages = (state as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) {
    return undefined;
  }

  for (const candidate of messages) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const record = candidate as Record<string, unknown>;
    const candidateId =
      normalizeMessageId(record.id) ??
      normalizeMessageId((record as { message_id?: unknown }).message_id);
    if (candidateId === messageId) {
      return record;
    }
  }

  return undefined;
};

export async function queryReactions({
  client,
  limit,
  message,
  messageId,
  next,
  reactionType,
  sort,
}: QueryReactionsParams): Promise<QueryReactionsResult> {
  const normalizedId =
    normalizeMessageId(messageId) ??
    normalizeMessageId((message as { id?: unknown } | null | undefined)?.id);

  if (!normalizedId) {
    return { reactions: [] };
  }

  const filter = reactionType ? { type: reactionType } : {};
  const queryOptions: { limit?: number; next?: string } = {};
  if (limit !== undefined) {
    queryOptions.limit = limit;
  }
  if (next !== undefined) {
    queryOptions.next = next;
  }

  if (hasQueryReactions(client)) {
    const response = await client.queryReactions(
      normalizedId,
      filter,
      sort,
      queryOptions,
    );
    const normalizedResponse = toQueryReactionsResult(response);
    if (normalizedResponse) {
      return normalizedResponse;
    }
  }

  const fallbackMessage: QueryReactionsShimMessage = {
    ...(message && typeof message === "object"
      ? (message as Record<string, unknown>)
      : {}),
    id: normalizedId,
  };

  const fallbackParams: QueryReactionsShimParams = {};
  if (limit !== undefined) {
    fallbackParams.limit = limit;
  }
  if (next !== undefined) {
    fallbackParams.next = next;
  }
  if (reactionType !== undefined) {
    fallbackParams.reaction_type = reactionType;
  }
  const normalizedSort = toReactionSortRecord(sort);
  if (normalizedSort) {
    fallbackParams.sort = normalizedSort;
  }

  const { queryReactions: shimQueryReactions } = await getChatSDKShimModule();
  const fallbackResponse = await shimQueryReactions(
    fallbackMessage,
    fallbackParams,
  );

  return toQueryReactionsResult(fallbackResponse) ?? { reactions: [] };
}

export const sendReaction = async ({
  channel,
  cid,
  message,
  messageId,
  type,
  user,
  userId,
  score,
  now,
}: SendReactionParams): Promise<SendReactionResult> => {
  const normalizedId =
    normalizeMessageId(messageId) ??
    normalizeMessageId((message as { id?: unknown } | null | undefined)?.id);

  if (!normalizedId) {
    throw new Error("Invalid message id provided to sendReaction");
  }

  const baseMessage =
    (message && typeof message === "object" ? (message as Record<string, unknown>) : undefined) ??
    findMessageById(channel, normalizedId);

  const workingMessage: Record<string, unknown> = baseMessage
    ? { ...baseMessage }
    : { id: normalizedId };

  const messageCid =
    typeof workingMessage.cid === "string"
      ? workingMessage.cid
      : typeof channel?.cid === "string"
        ? channel.cid
        : typeof cid === "string"
          ? cid
          : undefined;
  if (messageCid) {
    workingMessage.cid = messageCid;
  }
  workingMessage.id = normalizedId;

  const reactionUser =
    cloneReactionUser(user as ReactionUserLike | undefined) ??
    cloneReactionUser(channel?.getClient?.()?.user as ReactionUserLike | undefined);

  const resolvedUserId =
    normalizeUserId(userId) ??
    normalizeUserId((user as ReactionUserLike | undefined)?.id) ??
    normalizeUserId(reactionUser?.id) ??
    normalizeUserId(channel?.getClient?.()?.user?.id);

  const timestamp = resolveDate(now).toISOString();
  const reactionScore =
    typeof score === "number" && Number.isFinite(score) ? score : 1;

  const reactionPayload: ReactionResponseLike = {
    type,
    user: reactionUser,
    user_id: resolvedUserId,
    message_id: normalizedId,
    score: reactionScore,
    created_at: timestamp,
  };

  const ownList = toReactionList((baseMessage as { own_reactions?: unknown })?.own_reactions);
  workingMessage.own_reactions = addReactionToList(ownList, reactionPayload);

  const latestList = toReactionList(
    (baseMessage as { latest_reactions?: unknown })?.latest_reactions,
  );
  workingMessage.latest_reactions = addReactionToList(latestList, reactionPayload);

  const countsUpdate = incrementReactionCounts(
    (baseMessage as { reaction_counts?: unknown })?.reaction_counts,
    type,
  );
  if (countsUpdate.next) {
    workingMessage.reaction_counts = countsUpdate.next;
  }

  const scoresUpdate = incrementReactionScores(
    (baseMessage as { reaction_scores?: unknown })?.reaction_scores,
    type,
    reactionScore,
  );
  if (scoresUpdate.next) {
    workingMessage.reaction_scores = scoresUpdate.next;
  }

  const groupsUpdate = incrementReactionGroups(
    (baseMessage as { reaction_groups?: unknown })?.reaction_groups,
    type,
    reactionScore,
    timestamp,
  );
  if (groupsUpdate.next) {
    workingMessage.reaction_groups = groupsUpdate.next;
  }

  let normalizedMessage: Record<string, unknown>;
  if (channel) {
    try {
      normalizedMessage = await loadMessageIntoChannelState(channel as any, workingMessage);
    } catch {
      normalizedMessage = { ...workingMessage };
    }
  } else {
    normalizedMessage = { ...workingMessage };
  }

  const eventPayload: Record<string, unknown> = {
    type: "reaction.new",
    message: normalizedMessage,
  };

  const eventCid =
    typeof channel?.cid === "string"
      ? channel.cid
      : typeof cid === "string"
        ? cid
        : normalizeMessageId((normalizedMessage as { cid?: unknown })?.cid);
  if (eventCid) {
    eventPayload.cid = eventCid;
  }

  const eventReaction: Record<string, unknown> = {
    type,
    message_id: normalizedMessage.id ?? normalizedId,
    created_at: timestamp,
    score: reactionScore,
  };
  if (resolvedUserId) {
    eventReaction.user_id = resolvedUserId;
  }
  if (reactionUser) {
    eventReaction.user = { ...reactionUser };
  }

  eventPayload.reaction = eventReaction;

  if (channel && typeof channel.emit === "function") {
    channel.emit("reaction.new", eventPayload);
  }

  const client = channel?.getClient?.();
  if (
    client &&
    typeof (client as { emit?: (event: string, payload: Record<string, unknown>) => void }).emit ===
      "function"
  ) {
    (client as { emit: (event: string, payload: Record<string, unknown>) => void }).emit(
      "reaction.new",
      eventPayload,
    );
  }

  return { message: normalizedMessage };
};

export const deleteReaction = async ({
  channel,
  cid,
  message,
  messageId,
  type,
  userId,
}: DeleteReactionParams): Promise<DeleteReactionResult> => {
  const normalizedId =
    normalizeMessageId(messageId) ??
    normalizeMessageId((message as { id?: unknown } | null | undefined)?.id);

  if (!normalizedId) {
    throw new Error("Invalid message id provided to deleteReaction");
  }

  const baseMessage =
    (message && typeof message === "object" ? message : undefined) ??
    findMessageById(channel, normalizedId);

  const workingMessage: Record<string, unknown> = baseMessage
    ? { ...baseMessage }
    : { id: normalizedId };

  const messageCid =
    typeof workingMessage.cid === "string"
      ? workingMessage.cid
      : typeof channel?.cid === "string"
        ? channel.cid
        : typeof cid === "string"
          ? cid
          : undefined;
  if (messageCid) {
    workingMessage.cid = messageCid;
  }
  workingMessage.id = normalizedId;

  let resolvedUserId = normalizeUserId(userId);

  const ownList = toReactionList((baseMessage as { own_reactions?: unknown })?.own_reactions);
  const ownRemoval = removeFirstReaction(ownList, type, resolvedUserId);
  if (!resolvedUserId && ownRemoval.removed) {
    resolvedUserId =
      normalizeUserId(ownRemoval.removed.user_id) ??
      normalizeUserId((ownRemoval.removed.user as ReactionUserLike | undefined)?.id);
  }

  const latestList = toReactionList(
    (baseMessage as { latest_reactions?: unknown })?.latest_reactions,
  );
  const latestRemoval = removeFirstReaction(latestList, type, resolvedUserId);
  if (!resolvedUserId && latestRemoval.removed) {
    resolvedUserId =
      normalizeUserId(latestRemoval.removed.user_id) ??
      normalizeUserId((latestRemoval.removed.user as ReactionUserLike | undefined)?.id);
  }

  if (!resolvedUserId) {
    resolvedUserId =
      normalizeUserId(userId) ??
      normalizeUserId(channel?.getClient?.()?.user?.id) ??
      normalizeUserId((baseMessage as { user_id?: unknown })?.user_id);
  }

  if (ownRemoval.removed) {
    workingMessage.own_reactions = ownRemoval.list;
  }
  if (latestRemoval.removed) {
    workingMessage.latest_reactions = latestRemoval.list;
  }

  const reactionDetails = ownRemoval.removed ?? latestRemoval.removed;
  const reactionRemoved = Boolean(reactionDetails);

  if (reactionRemoved) {
    const countUpdate = updateReactionCounts(
      (baseMessage as { reaction_counts?: unknown })?.reaction_counts,
      type,
    );
    if (countUpdate.changed) {
      if (countUpdate.next) {
        workingMessage.reaction_counts = countUpdate.next;
      } else {
        delete (workingMessage as Record<string, unknown>).reaction_counts;
      }
    }

    const scoreValue = getReactionScore(reactionDetails);
    const scoreUpdate = updateReactionScores(
      (baseMessage as { reaction_scores?: unknown })?.reaction_scores,
      type,
      scoreValue,
    );
    if (scoreUpdate.changed) {
      if (scoreUpdate.next) {
        workingMessage.reaction_scores = scoreUpdate.next;
      } else {
        delete (workingMessage as Record<string, unknown>).reaction_scores;
      }
    }

    const groupUpdate = updateReactionGroups(
      (baseMessage as { reaction_groups?: unknown })?.reaction_groups,
      type,
      scoreValue,
    );
    if (groupUpdate.changed) {
      if (groupUpdate.next) {
        workingMessage.reaction_groups = groupUpdate.next;
      } else {
        delete (workingMessage as Record<string, unknown>).reaction_groups;
      }
    }
  }

  let normalizedMessage: Record<string, unknown>;
  if (channel) {
    try {
      normalizedMessage = await loadMessageIntoChannelState(channel as any, workingMessage);
    } catch {
      normalizedMessage = { ...workingMessage };
    }
  } else {
    normalizedMessage = { ...workingMessage };
  }

  const eventPayload: Record<string, unknown> = {
    type: "reaction.deleted",
    message: normalizedMessage,
  };

  const eventCid =
    typeof channel?.cid === "string"
      ? channel.cid
      : typeof cid === "string"
        ? cid
        : normalizeMessageId((normalizedMessage as { cid?: unknown })?.cid);
  if (eventCid) {
    eventPayload.cid = eventCid;
  }

  const reactionEvent: Record<string, unknown> = {
    type,
    message_id: normalizedMessage.id ?? normalizedId,
  };
  if (resolvedUserId) {
    reactionEvent.user_id = resolvedUserId;
  }
  const reactionScore = getReactionScore(reactionDetails);
  if (reactionScore) {
    reactionEvent.score = reactionScore;
  }
  const reactionUser =
    cloneReactionUser(reactionDetails?.user as ReactionUserLike | undefined) ??
    cloneReactionUser(channel?.getClient?.()?.user as ReactionUserLike | undefined);
  if (reactionUser) {
    reactionEvent.user = reactionUser;
  }

  eventPayload.reaction = reactionEvent;

  if (channel && typeof channel.emit === "function") {
    channel.emit("reaction.deleted", eventPayload);
  }

  const client = channel?.getClient?.();
  if (
    client &&
    typeof (client as { emit?: (event: string, payload: Record<string, unknown>) => void }).emit ===
      "function"
  ) {
    (client as { emit: (event: string, payload: Record<string, unknown>) => void }).emit(
      "reaction.deleted",
      eventPayload,
    );
  }

  return { message: normalizedMessage };
};

type ChannelWithSendAction = Channel & {
  sendAction?: (
    messageId: string,
    formData: Record<string, string>,
  ) => Promise<unknown>;
};

const channelCanSendAction = (
  channel?: Channel | null,
): channel is ChannelWithSendAction & {
  sendAction: (messageId: string, formData: Record<string, string>) => Promise<unknown>;
} =>
  Boolean(
    channel && typeof (channel as ChannelWithSendAction).sendAction === "function",
  );

const normalizeActionFormData = (
  formData: Record<string, string>,
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }
  return normalized;
};

const normalizeSendActionResponse = async (
  response: unknown,
  channel?: Channel | null,
): Promise<SendActionResult | undefined> => {
  if (!isRecord(response)) {
    return undefined;
  }

  const messageCandidate = (response as { message?: unknown }).message;
  if (messageCandidate && typeof messageCandidate === "object") {
    const workingMessage = messageCandidate as Record<string, unknown>;

    let normalizedMessage: Record<string, unknown>;
    if (channel) {
      try {
        normalizedMessage = await loadMessageIntoChannelState(
          channel as any,
          workingMessage,
        );
      } catch {
        normalizedMessage = { ...workingMessage };
      }
    } else {
      normalizedMessage = { ...workingMessage };
    }

    return {
      status: "ok",
      message: normalizedMessage as unknown as LocalMessage,
    };
  }

  const status = (response as { status?: unknown }).status;
  if (typeof status === "string") {
    return { status: "ok" };
  }

  return undefined;
};

export type SendActionFormData = Record<string, string>;

export type SendActionOptions = {
  channel?: Channel | null;
};

export type SendActionResult = { status: "ok"; message?: LocalMessage };

export const sendAction = async (
  messageId: string,
  formData: SendActionFormData,
  options: SendActionOptions = {},
): Promise<SendActionResult> => {
  const normalizedId = String(messageId ?? "").trim();
  if (!normalizedId) {
    return { status: "ok" };
  }

  const normalizedFormData = normalizeActionFormData(formData);
  const { channel } = options;

  if (channelCanSendAction(channel)) {
    try {
      const response = await channel.sendAction(normalizedId, normalizedFormData);
      const normalizedResponse = await normalizeSendActionResponse(response, channel);
      if (normalizedResponse) {
        return normalizedResponse;
      }
    } catch {
      // fall back to shim behaviour
    }
  }

  return { status: "ok" };
};

const resolveDate = (value: Date | undefined): Date => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  return new Date();
};

export const pinMessage = async ({
  channel,
  cid,
  message,
  messageId,
  pinExpires,
  user,
  now,
}: PinMessageParams): Promise<PinMessageResult> => {
  const normalizedId =
    normalizeMessageId(messageId) ??
    normalizeMessageId((message as { id?: unknown } | null | undefined)?.id);

  if (!normalizedId) {
    throw new Error("Invalid message id provided to pinMessage");
  }

  const baseMessage =
    (message && typeof message === "object" ? (message as Record<string, unknown>) : undefined) ??
    findMessageById(channel, normalizedId);

  const workingMessage: Record<string, unknown> = baseMessage
    ? { ...baseMessage }
    : { id: normalizedId };

  workingMessage.id = normalizedId;

  const resolvedChannel = channel ?? undefined;

  const resolvedCid =
    (typeof workingMessage.cid === "string" && workingMessage.cid) ??
    (typeof resolvedChannel?.cid === "string" ? resolvedChannel.cid : undefined) ??
    (typeof cid === "string" ? cid : undefined);

  if (resolvedCid) {
    workingMessage.cid = resolvedCid;
  }

  const timestamp = resolveDate(now);
  workingMessage.pinned = true;
  workingMessage.pinned_at = timestamp;

  const pinnedByRecord =
    cloneRecord(user) ??
    cloneRecord(resolvedChannel?.getClient?.()?.user) ??
    cloneRecord((workingMessage as { user?: unknown }).user);

  if (pinnedByRecord) {
    workingMessage.pinned_by = pinnedByRecord;
  }

  const expiresCandidate =
    pinExpires === undefined
      ? (baseMessage as { pin_expires?: unknown } | undefined)?.pin_expires
      : pinExpires;

  if (expiresCandidate !== undefined) {
    if (expiresCandidate === null) {
      workingMessage.pin_expires = null;
    } else if (expiresCandidate instanceof Date) {
      workingMessage.pin_expires = expiresCandidate;
    } else {
      workingMessage.pin_expires = expiresCandidate;
    }
  }

  if (!workingMessage.cid && resolvedCid) {
    workingMessage.cid = resolvedCid;
  }

  let normalizedMessage: Record<string, unknown>;
  if (resolvedChannel) {
    try {
      normalizedMessage = await loadMessageIntoChannelState(
        resolvedChannel as any,
        workingMessage,
      );
    } catch {
      normalizedMessage = { ...workingMessage };
    }
  } else {
    normalizedMessage = { ...workingMessage };
  }

  normalizedMessage.pinned = true;
  normalizedMessage.pinned_at = timestamp;
  if (pinnedByRecord) {
    normalizedMessage.pinned_by = { ...pinnedByRecord };
  }
  if (expiresCandidate !== undefined) {
    normalizedMessage.pin_expires = workingMessage.pin_expires;
  }

  const membershipPinExpires = normalizePinExpiresForMembership(
    expiresCandidate ?? (normalizedMessage as { pin_expires?: unknown })?.pin_expires,
  );

  if (resolvedChannel) {
    applyChannelPinLocally(resolvedChannel, timestamp, pinnedByRecord, membershipPinExpires);

    const state = resolvedChannel.state;
    if (isRecord(state)) {
      const rawPinned = state.pinnedMessages;
      const nextPinned = Array.isArray(rawPinned)
        ? [...(rawPinned as Array<Record<string, unknown>>)]
        : [];
      const pinnedEntry: Record<string, unknown> = { ...normalizedMessage };

      const existingIndex = nextPinned.findIndex(
        (item) => normalizeMessageId((item as { id?: unknown }).id) === normalizedId,
      );

      if (existingIndex >= 0) {
        nextPinned[existingIndex] = pinnedEntry;
      } else {
        nextPinned.unshift(pinnedEntry);
      }

      (state as Record<string, unknown>).pinnedMessages = nextPinned;

      resolvedChannel.stateStore?.dispatch?.({ pinnedMessages: nextPinned });
    }
  }

  const eventPayload: Record<string, unknown> = {
    type: "message.updated",
    message: normalizedMessage,
  };

  if (resolvedCid) {
    eventPayload.cid = resolvedCid;
  }

  if (resolvedChannel && typeof resolvedChannel.emit === "function") {
    resolvedChannel.emit("message.updated", eventPayload);
  }

  const client = resolvedChannel?.getClient?.();
  if (client) {
    if (typeof (client as { emit?: unknown }).emit === "function") {
      (client as { emit: (event: string, payload: Record<string, unknown>) => void }).emit(
        "message.updated",
        eventPayload,
      );
    } else if (typeof (client as { dispatchEvent?: unknown }).dispatchEvent === "function") {
      (client as { dispatchEvent: (event: Record<string, unknown>) => void }).dispatchEvent(
        eventPayload,
      );
    }
  }

  return {
    pinned: true as const,
    at: timestamp.toISOString(),
    message: normalizedMessage,
  };
};

export const unpinMessage = async ({
  channel,
  cid,
  message,
  messageId,
  now,
}: UnpinMessageParams): Promise<UnpinMessageResult> => {
  const normalizedId =
    normalizeMessageId(messageId) ??
    normalizeMessageId((message as { id?: unknown } | null | undefined)?.id);

  if (!normalizedId) {
    throw new Error("Invalid message id provided to unpinMessage");
  }

  const baseMessage =
    (message && typeof message === "object" ? (message as Record<string, unknown>) : undefined) ??
    findMessageById(channel, normalizedId);

  const workingMessage: Record<string, unknown> = baseMessage
    ? { ...baseMessage }
    : { id: normalizedId };

  workingMessage.id = normalizedId;

  const resolvedChannel = channel ?? undefined;

  const resolvedCid =
    (typeof workingMessage.cid === "string" && workingMessage.cid) ??
    (typeof resolvedChannel?.cid === "string" ? resolvedChannel.cid : undefined) ??
    (typeof cid === "string" ? cid : undefined);

  if (resolvedCid) {
    workingMessage.cid = resolvedCid;
  }

  const timestamp = resolveDate(now);

  workingMessage.pinned = false;
  workingMessage.pinned_at = null;
  workingMessage.pinned_by = null;
  workingMessage.pin_expires = null;

  let normalizedMessage: Record<string, unknown>;
  if (resolvedChannel) {
    try {
      normalizedMessage = await loadMessageIntoChannelState(
        resolvedChannel as any,
        workingMessage,
      );
    } catch {
      normalizedMessage = { ...workingMessage };
    }
  } else {
    normalizedMessage = { ...workingMessage };
  }

  normalizedMessage.pinned = false;
  normalizedMessage.pinned_at = null;
  normalizedMessage.pin_expires = null;
  normalizedMessage.pinned_by = null;

  if (resolvedChannel) {
    applyChannelUnpinLocally(resolvedChannel);

    const state = resolvedChannel.state;
    if (isRecord(state)) {
      const rawPinned = state.pinnedMessages;
      if (Array.isArray(rawPinned)) {
        const nextPinned = rawPinned.filter((item) => {
          if (!item || typeof item !== "object") {
            return true;
          }
          const record = item as Record<string, unknown>;
          const candidateId = normalizeMessageId((record as { id?: unknown }).id);
          return candidateId !== normalizedId;
        });

        if (nextPinned.length !== rawPinned.length) {
          (state as Record<string, unknown>).pinnedMessages = nextPinned;
          resolvedChannel.stateStore?.dispatch?.({ pinnedMessages: nextPinned });
        }
      }
    }
  }

  const eventPayload: Record<string, unknown> = {
    type: "message.updated",
    message: normalizedMessage,
  };

  if (resolvedCid) {
    eventPayload.cid = resolvedCid;
  }

  if (resolvedChannel && typeof resolvedChannel.emit === "function") {
    resolvedChannel.emit("message.updated", eventPayload);
  }

  const client = resolvedChannel?.getClient?.();
  if (client) {
    if (typeof (client as { emit?: unknown }).emit === "function") {
      (client as { emit: (event: string, payload: Record<string, unknown>) => void }).emit(
        "message.updated",
        eventPayload,
      );
    } else if (typeof (client as { dispatchEvent?: unknown }).dispatchEvent === "function") {
      (client as { dispatchEvent: (event: Record<string, unknown>) => void }).dispatchEvent(
        eventPayload,
      );
    }
  }

  return {
    pinned: false as const,
    at: timestamp.toISOString(),
    message: normalizedMessage,
  };
};

const parseWebPushKeys = (value: unknown): WebPushKeys => {
  if (!isRecord(value)) {
    throw new Error('Invalid web push keys response');
  }
  const { p256dh, auth } = value;
  if (typeof p256dh !== 'string' || typeof auth !== 'string') {
    throw new Error('Invalid web push keys response');
  }
  return { p256dh, auth };
};

const parseWebPushSubscription = (value: unknown): WebPushSubscription => {
  if (!isRecord(value)) {
    throw new Error('Invalid web push subscription response');
  }

  const { endpoint } = value;
  if (typeof endpoint !== 'string') {
    throw new Error('Invalid web push subscription response');
  }

  const subscription: WebPushSubscription = {
    endpoint,
    keys: parseWebPushKeys(value.keys),
  };

  if ('expirationTime' in value) {
    const expiration = value.expirationTime;
    if (expiration === null) {
      subscription.expirationTime = null;
    } else if (typeof expiration === 'number') {
      subscription.expirationTime = expiration;
    } else {
      throw new Error('Invalid web push subscription response');
    }
  }

  return subscription;
};

export const getAppSettings = async (): Promise<AppSettings> => {
  const response = await authorizedFetch("/api/app-settings/", {
    method: "GET",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch app settings (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as AppSettings;
};


export const listUserAgents = async (): Promise<UserAgentInfo> => {
  const response = await authorizedFetch("/api/user-agent/", { method: "GET" });
  if (!response.ok) {
    const error = new Error(`Failed to fetch user agent (status ${response.status})`);
    (error as ErrorWithStatus).status = response.status;
    throw error;
  }
  const data = (await response.json()) as Partial<UserAgentInfo>;
  return { user_agent: typeof data.user_agent === "string" ? data.user_agent : "" };
};

export const setUserAgent = async (body: SetUserAgentInput = {}): Promise<UserAgentInfo> => {
  const options: RequestInit = { method: "POST" };
  if (Object.keys(body).length) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await authorizedFetch("/api/user-agent/", options);
  if (!response.ok) {
    const error = new Error(`Failed to set user agent (status ${response.status})`);
    (error as ErrorWithStatus).status = response.status;
    throw error;
  }
  const data = (await response.json()) as Partial<UserAgentInfo>;
  if (typeof data.user_agent !== "string") throw new Error("Invalid user agent response");
  return { user_agent: data.user_agent };
};

export const syncUser = async (
  body: SyncUserRequest = {},
): Promise<SyncUserResponse> => {
  const payload: Record<string, unknown> = {};
  let token: string | undefined;

  if (isRecord(body)) {
    Object.entries(body).forEach(([key, value]) => {
      if (key === "__token" && typeof value === "string") {
        token = value;
        return;
      }
      payload[key] = value;
    });
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length > 0) {
    headers["Content-Type"] = "application/json";
  }

  const options: RequestInit = {
    method: "POST",
  };

  if (Object.keys(headers).length > 0) {
    options.headers = headers;
  }

  if (payloadKeys.length > 0) {
    options.body = JSON.stringify(payload);
  }

  const response = await authorizedFetch("/api/sync-user/", options);

  if (!response.ok) {
    const error = new Error(`Failed to sync user (status ${response.status})`);
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;
  if (!isRecord(data) || typeof data.id !== "number" || typeof data.username !== "string") {
    throw new Error("Invalid sync user response");
  }

  return data as SyncUserResponse;
};

export const registerSubscriptions = async (
  body: RegisterSubscriptionsInput,
): Promise<RegisterSubscriptionsResponse> => {
  const response = await authorizedFetch("/api/register-subscriptions/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to register subscriptions (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;
  if (!isRecord(data)) {
    throw new Error('Invalid register subscriptions response');
  }

  const { subscriptions: rawSubscriptions } = data;
  if (!Array.isArray(rawSubscriptions)) {
    throw new Error('Invalid register subscriptions response');
  }

  const subscriptions = rawSubscriptions.map((item) =>
    parseWebPushSubscription(item),
  );

  let clientId: string | null | undefined;
  if ('client_id' in data) {
    const rawClientId = data.client_id;
    if (typeof rawClientId === 'string') {
      clientId = rawClientId;
    } else if (rawClientId === null) {
      clientId = null;
    } else {
      throw new Error('Invalid register subscriptions response');
    }
  }

  let platform: RegisterSubscriptionsResponse['platform'];
  if ('platform' in data) {
    const rawPlatform = data.platform;
    if (rawPlatform === 'web' || rawPlatform === 'ios' || rawPlatform === 'android') {
      platform = rawPlatform;
    } else if (rawPlatform === null) {
      platform = null;
    } else {
      throw new Error('Invalid register subscriptions response');
    }
  }

  return {
    subscriptions,
    ...(clientId !== undefined ? { client_id: clientId } : {}),
    ...(platform !== undefined ? { platform } : {}),
  };
};

export const listUsers = async (): Promise<User[]> => {
  const response = await authorizedFetch("/api/users/", {
    method: "GET",
  });

  if (!response.ok) {
    const error = new Error(`Failed to fetch users (status ${response.status})`);
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("Invalid users response");
  }

  return data.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid users response item");
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== "number" ||
      typeof candidate.username !== "string"
    ) {
      throw new Error("Invalid users response item");
    }

    return { id: candidate.id, username: candidate.username };
  });
};

async function deleteMessage({ cid, message_id }: DeleteMessageParams): Promise<void> {
  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to delete message (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }
}

async function updateMessage({
  cid,
  message_id,
  text,
}: UpdateMessageInput): Promise<Message> {
  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to update message (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as Message;
}

export const muteUser = async ({
  cid,
  user_id,
  muted_until,
}: MuteUserInput): Promise<Mute> => {
  const payload: Record<string, unknown> = { user_id };
  if (muted_until) {
    payload.muted_until = muted_until;
  }

  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/mutes/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = new Error(`Failed to mute user (status ${response.status})`);
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<Mute>;

  if (
    typeof data?.id !== "number" ||
    typeof data.user_id !== "number" ||
    typeof data.muted_by !== "number" ||
    typeof data.created_at !== "string"
  ) {
    throw new Error("Invalid mute response");
  }

  let mutedUntil: string | null = null;
  if (typeof data.muted_until === "string") {
    mutedUntil = data.muted_until;
  } else if (data.muted_until === null || data.muted_until === undefined) {
    mutedUntil = null;
  } else {
    throw new Error("Invalid muted_until value");
  }

  return {
    id: data.id,
    user_id: data.user_id,
    muted_until: mutedUntil,
    muted_by: data.muted_by,
    created_at: data.created_at,
  };
};

export const unmuteUser = async ({
  target_user_id,
}: UnmuteUserRequest): Promise<UnmuteUserResponse> => {
  const response = await authorizedFetch("/api/user-mutes/unmute/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_user_id }),
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to unmute user (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<UnmuteUserResponse>;

  if (
    typeof data?.target_user_id !== "number" ||
    ("muted" in data && data.muted !== false)
  ) {
    throw new Error("Invalid unmute user response");
  }

  return { target_user_id: data.target_user_id, muted: false };
};

export const muteStatus = async ({ cid }: { cid: string }): Promise<MuteStatus> => {
  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/mute/`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch mute status (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<MuteStatus>;
  return {
    muted: Boolean(data?.muted),
    muted_until:
      typeof data?.muted_until === "string" || data?.muted_until === null
        ? (data?.muted_until ?? null)
        : null,
  };
};

export const getMessage = async ({
  cid,
  message_id,
}: {
  cid: string;
  message_id: string | number;
}): Promise<Message> => {
  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch message (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as Message;
};

export const listRoomDrafts = async ({
  room_uuid,
}: {
  room_uuid: string;
}): Promise<RoomDraft[]> => {
  const response = await authorizedFetch(
    `/api/rooms/${encodeURIComponent(room_uuid)}/draft/`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch room drafts (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? (data as RoomDraft[]) : [];
};

type ReminderEntryLike = {
  reminder?: Partial<Reminder> & {
    id?: string | number | null;
    message_id?: string | number | null;
  };
  timer?: ReturnType<typeof setTimeout> | null;
};

type ReminderManagerLike = {
  upsertReminder?: (messageId: string, remind_at: string) => Promise<unknown>;
  deleteReminder?: (id: string) => Promise<unknown>;
  store?: StateStore<{ reminders?: ReminderEntryLike[] }>;
  state?: StateStore<{ reminders?: unknown }>;
  scheduledOffsetsMs?: number[];
  initTimers?: () => void;
};

export type ReminderAwareClient =
  | { reminders?: ReminderManagerLike }
  | null
  | undefined;

export type RemindersUpsertReminderParams = {
  reminder: CreateReminderInput;
  reminders?: ReminderManagerLike | null;
  client?: ReminderAwareClient | StreamChat | null;
};

async function createReminder(body: CreateReminderInput): Promise<Reminder> {
  const response = await authorizedFetch("/api/reminders/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to create reminder (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as Reminder;
}

const normalizeReminderId = (value: unknown): string | undefined => {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const upsertReminderStoreEntry = (
  manager: ReminderManagerLike | undefined,
  reminder: Reminder,
): ReminderEntryLike | undefined => {
  const store = manager?.store;
  const getLatest = store?.getLatestValue ?? store?.getSnapshot;

  if (!store || typeof getLatest !== "function") {
    return undefined;
  }

  const snapshot = getLatest.call(store);
  const currentEntries = Array.isArray(snapshot?.reminders)
    ? (snapshot?.reminders as ReminderEntryLike[])
    : [];

  const reminderId = normalizeReminderId(reminder.id);
  const nextEntries: ReminderEntryLike[] = [];
  let updatedEntry: ReminderEntryLike | undefined;
  let replaced = false;

  for (const entry of currentEntries) {
    const entryId = normalizeReminderId(entry?.reminder?.id);
    if (reminderId && entryId === reminderId) {
      const merged: ReminderEntryLike = {
        ...entry,
        reminder: {
          ...(entry.reminder ?? {}),
          ...reminder,
        },
      };
      nextEntries.push(merged);
      updatedEntry = merged;
      replaced = true;
    } else {
      nextEntries.push(entry);
    }
  }

  if (!replaced) {
    updatedEntry = { reminder: { ...reminder } };
    nextEntries.push(updatedEntry);
  }

  dispatchStateStorePatch(store, { reminders: nextEntries });
  return updatedEntry;
};

const upsertReminderStateEntry = (
  manager: ReminderManagerLike | undefined,
  entry: ReminderEntryLike | undefined,
) => {
  if (!entry?.reminder) return;
  const stateStore = manager?.state;
  const getLatest = stateStore?.getLatestValue ?? stateStore?.getSnapshot;

  if (!stateStore || typeof getLatest !== "function") {
    return;
  }

  const snapshot = getLatest.call(stateStore);
  if (!snapshot || typeof snapshot !== "object") {
    return;
  }

  const container = (snapshot as { reminders?: unknown }).reminders;
  const messageId = normalizeReminderId(entry.reminder.message_id);

  if (!container || !messageId) {
    return;
  }

  if (container instanceof Map) {
    const next = new Map(container);
    next.set(messageId, entry);
    dispatchStateStorePatch(stateStore, { reminders: next });
    return;
  }

  if (Array.isArray(container)) {
    const next = container.slice();
    let replaced = false;

    for (let index = 0; index < next.length; index += 1) {
      const existing = next[index] as ReminderEntryLike | undefined;
      const existingId = normalizeReminderId(existing?.reminder?.message_id);
      if (existingId === messageId) {
        next[index] = { ...existing, ...entry };
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      next.push(entry);
    }

    dispatchStateStorePatch(stateStore, { reminders: next });
    return;
  }

  if (typeof container === "object") {
    const clone: Record<string, unknown> = {
      ...(container as Record<string, unknown>),
    };
    clone[messageId] = entry;
    dispatchStateStorePatch(stateStore, { reminders: clone });
  }
};

const remindersUpsertReminder = async ({
  reminder,
  reminders,
  client,
}: RemindersUpsertReminderParams): Promise<any> => {
  const reminderManager =
    reminders ??
    toReminderManager(client) ??
    toReminderManager(getDefaultRemindersClient());

  if (reminderManager?.upsertReminder) {
    const messageId = reminder.message_id ?? "";
    return reminderManager.upsertReminder(String(messageId), reminder.remind_at);
  }

  const createdReminder = await createReminder(reminder);

  if (reminderManager) {
    const entry = upsertReminderStoreEntry(reminderManager, createdReminder);
    upsertReminderStateEntry(reminderManager, entry);
    try {
      reminderManager.initTimers?.();
    } catch {
      // ignore reminder manager timer errors
    }
  }

  return createdReminder;
};

export type RemindersUnregisterSubscriptionsParams = {
  client?: ReminderAwareClient | StreamChat | null;
};

type RemindersSubscriptionsClient = {
  reminders?: {
    unregisterSubscriptions?: () => void;
    clearTimers?: () => void;
    store?: StateStore<{ reminders?: unknown }>;
    state?: StateStore<{ reminders?: unknown }>;
  };
};

const getDefaultRemindersClient = (): ReminderAwareClient => {
  try {
    return getLocalClient() as ReminderAwareClient;
  } catch {
    return undefined;
  }
};

const getDefaultRemindersSubscriptionsClient =
  (): RemindersSubscriptionsClient | undefined => {
    const client = getDefaultRemindersClient();
    if (!client) return undefined;
    if (
      typeof client === 'object' &&
      'reminders' in (client as Record<string, unknown>)
    ) {
      return client as RemindersSubscriptionsClient;
    }
    return undefined;
  };

const toRemindersSubscriptionsClient = (
  client: RemindersUnregisterSubscriptionsParams['client'],
): RemindersSubscriptionsClient | undefined => {
  if (!client || typeof client !== 'object') return undefined;
  if (
    'reminders' in (client as Record<string, unknown>) &&
    typeof (client as Record<string, unknown>).reminders === 'object'
  ) {
    return client as RemindersSubscriptionsClient;
  }
  return undefined;
};

const toReminderManager = (
  client?: ReminderAwareClient | StreamChat | null,
): ReminderManagerLike | undefined => {
  if (!client || typeof client !== "object") return undefined;
  if (
    "reminders" in (client as Record<string, unknown>) &&
    (client as ReminderAwareClient)?.reminders &&
    typeof (client as ReminderAwareClient)?.reminders === "object"
  ) {
    return (client as ReminderAwareClient).reminders as ReminderManagerLike;
  }
  return undefined;
};

const dispatchStateStorePatch = (
  store: StateStore<any> | undefined,
  patch: Record<string, unknown>,
) => {
  if (!store) return;
  if (typeof store.dispatch === "function") {
    store.dispatch(patch);
    return;
  }
  if (typeof store.next === "function") {
    store.next(patch);
    return;
  }
  const maybeSet = (store as { _set?: (patch: Record<string, unknown>) => void })._set;
  if (typeof maybeSet === "function") {
    maybeSet(patch);
  }
};

const clearReminderStoreEntries = (
  manager: ReminderManagerLike | undefined,
) => {
  const store = manager?.store;
  const getLatest = store?.getLatestValue ?? store?.getSnapshot;
  if (!store || typeof getLatest !== 'function') return;

  const snapshot = getLatest.call(store);
  const reminders = Array.isArray(snapshot?.reminders)
    ? (snapshot?.reminders as ReminderEntryLike[])
    : [];

  if (!reminders.length) return;

  for (const entry of reminders) {
    const handle = entry?.timer;
    if (!handle) continue;
    try {
      clearTimeout(handle as ReturnType<typeof setTimeout>);
    } catch {
      try {
        clearInterval(handle as ReturnType<typeof setInterval>);
      } catch {
        // ignore timers that cannot be cleared
      }
    }
  }

  dispatchStateStorePatch(store, { reminders: [] });
};

const clearReminderStateStore = (
  manager: ReminderManagerLike | undefined,
) => {
  const stateStore = manager?.state;
  const getLatest = stateStore?.getLatestValue ?? stateStore?.getSnapshot;
  if (!stateStore || typeof getLatest !== 'function') return;

  const snapshot = getLatest.call(stateStore);
  if (!snapshot || typeof snapshot !== 'object') return;

  const container = (snapshot as { reminders?: unknown }).reminders;
  if (!container) return;

  if (container instanceof Map) {
    if (!container.size) return;
    dispatchStateStorePatch(stateStore, { reminders: new Map() });
    return;
  }

  if (Array.isArray(container)) {
    if (!container.length) return;
    dispatchStateStorePatch(stateStore, { reminders: [] });
    return;
  }

  if (typeof container === 'object') {
    if (!Object.keys(container as Record<string, unknown>).length) return;
    dispatchStateStorePatch(stateStore, { reminders: {} });
  }
};

const resetReminderManagerState = (
  manager: ReminderManagerLike | undefined,
) => {
  if (!manager) return;
  clearReminderStoreEntries(manager);
  clearReminderStateStore(manager);
};

const removeReminderFromStore = (
  manager: ReminderManagerLike | undefined,
  reminderId: string,
): ReminderEntryLike[] => {
  const store = manager?.store;
  const getLatest = store?.getLatestValue ?? store?.getSnapshot;
  if (!store || typeof getLatest !== "function") {
    return [];
  }
  const current = getLatest.call(store);
  const list = Array.isArray(current?.reminders)
    ? (current?.reminders as ReminderEntryLike[])
    : [];
  if (!list.length) return [];

  const next: ReminderEntryLike[] = [];
  const removed: ReminderEntryLike[] = [];

  for (const entry of list) {
    const entryId = normalizeReminderId(entry?.reminder?.id);
    if (entryId === reminderId) {
      removed.push(entry);
    } else {
      next.push(entry);
    }
  }

  if (removed.length) {
    for (const entry of removed) {
      const timerHandle = entry?.timer;
      if (timerHandle) {
        try {
          clearTimeout(timerHandle as ReturnType<typeof setTimeout>);
        } catch {
          clearTimeout(timerHandle as any);
        }
      }
    }
    dispatchStateStorePatch(store, { reminders: next });
  }

  return removed;
};

const updateReminderState = (
  manager: ReminderManagerLike | undefined,
  removed: ReminderEntryLike[],
) => {
  if (!removed.length) return;
  const stateStore = manager?.state;
  const getLatest = stateStore?.getLatestValue ?? stateStore?.getSnapshot;
  if (!stateStore || typeof getLatest !== "function") return;
  const current = getLatest.call(stateStore);
  if (!current || typeof current !== "object") return;

  const container = (current as { reminders?: unknown }).reminders;
  if (!container) return;

  const messageIds = removed
    .map((entry) => entry?.reminder?.message_id)
    .filter((value): value is string | number =>
      value !== undefined && value !== null && `${value}` !== "",
    )
    .map((value) => String(value));

  if (!messageIds.length) return;

  if (container instanceof Map) {
    const next = new Map(container);
    let changed = false;
    for (const key of messageIds) {
      if (next.delete(key)) {
        changed = true;
      }
    }
    if (changed) {
      dispatchStateStorePatch(stateStore, { reminders: next });
    }
    return;
  }

  if (Array.isArray(container)) {
    const ids = new Set(messageIds);
    const next = container.filter((entry) => {
      const messageId = (entry as ReminderEntryLike)?.reminder?.message_id;
      return !ids.has(String(messageId ?? ""));
    });
    if (next.length !== container.length) {
      dispatchStateStorePatch(stateStore, { reminders: next });
    }
    return;
  }

  if (typeof container === "object") {
    const clone: Record<string, unknown> = {
      ...(container as Record<string, unknown>),
    };
    let changed = false;
    for (const key of messageIds) {
      if (Object.prototype.hasOwnProperty.call(clone, key)) {
        delete clone[key];
        changed = true;
      }
    }
    if (changed) {
      dispatchStateStorePatch(stateStore, { reminders: clone });
    }
  }
};

const remindersUnregisterSubscriptions = async (
  params: RemindersUnregisterSubscriptionsParams = {},
): Promise<void> => {
  const defaultClient = getDefaultRemindersClient();
  const normalizedClient =
    toRemindersSubscriptionsClient(params.client) ??
    getDefaultRemindersSubscriptionsClient();

  normalizedClient?.reminders?.unregisterSubscriptions?.();

  const reminderManager =
    toReminderManager(params.client) ??
    toReminderManager(normalizedClient as ReminderAwareClient | StreamChat | null) ??
    toReminderManager(defaultClient);

  const clearTimersTarget =
    reminderManager ?? normalizedClient?.reminders ?? defaultClient?.reminders;

  try {
    clearTimersTarget?.clearTimers?.();
  } catch {
    // ignore custom client errors
  }

  clearAllReminderTimers();
  resetReminderManagerState(
    reminderManager ?? (clearTimersTarget as ReminderManagerLike | undefined),
  );
};

const deleteReminder = async ({
  cid: _cid,
  reminderId,
  client,
}: DeleteReminderParams & { client?: ReminderAwareClient | StreamChat | null }): Promise<DeleteReminderResult> => {
  const normalizedId = reminderId;
  const reminderManager =
    toReminderManager(client) ?? toReminderManager(getDefaultRemindersClient());

  if (reminderManager?.deleteReminder) {
    await reminderManager.deleteReminder(normalizedId);
    return { ok: true, reminderId: normalizedId };
  }

  const response = await authorizedFetch(
    `/api/reminders/${encodeURIComponent(reminderId)}/`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = new Error(`Failed to delete reminder (status ${response.status})`);
    (error as ErrorWithStatus).status = response.status;
    throw error;
  }

  try {
    await response.json();
  } catch {
    // ignore body parsing errors (204, empty responses, etc.)
  }

  if (reminderManager) {
    const removed = removeReminderFromStore(reminderManager, normalizedId);
    updateReminderState(reminderManager, removed);
  }

  return { ok: true, reminderId: normalizedId };
};

async function endSession(): Promise<void> {
  const response = await authorizedFetch("/api/session/", {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to end session (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }
}

type NotificationStoreLike = {
  getLatestValue?: () => NotificationManagerState | undefined;
  getSnapshot?: () => NotificationManagerState | undefined;
  subscribe?: (listener: () => void) => () => void;
  subscribeWithSelector?: (
    selector: (value: NotificationManagerState) => unknown,
    listener: () => void,
  ) => () => void;
  dispatch?: (patch: Partial<NotificationManagerState>) => void;
  next?: (patch: Partial<NotificationManagerState>) => void;
  _set?: (patch: Partial<NotificationManagerState>) => void;
};

type NotificationsStoreClient = {
  notifications?: {
    store?:
      | StateStore<NotificationManagerState>
      | NotificationStoreLike
      | null;
  } | null;
};

type NotificationsUpdater =
  | Notification[]
  | ((current: Notification[]) => Notification[]);

const emptyNotificationsState: NotificationManagerState = { notifications: [] };

const fallbackNotificationsStore = new StateStore<NotificationManagerState>({
  notifications: [],
});

const readNotificationState = (
  store: NotificationStoreLike,
): NotificationManagerState => {
  if (typeof store.getLatestValue === "function") {
    const latest = store.getLatestValue();
    if (latest && typeof latest === "object") {
      return latest;
    }
  }

  if (typeof store.getSnapshot === "function") {
    const snapshot = store.getSnapshot();
    if (snapshot && typeof snapshot === "object") {
      return snapshot;
    }
  }

  return emptyNotificationsState;
};

const notificationArrayFromState = (
  notifications: NotificationManagerState["notifications"],
): Notification[] => {
  if (Array.isArray(notifications)) {
    return notifications as Notification[];
  }
  return emptyNotificationsState.notifications;
};

const areNotificationArraysEqual = (
  previous: Notification[],
  next: Notification[],
): boolean => {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== next[index]) return false;
  }
  return true;
};

const applyNotificationPatch = (
  store: NotificationStoreLike,
  patch: Partial<NotificationManagerState>,
) => {
  if (typeof store.dispatch === "function") {
    store.dispatch(patch);
    return;
  }

  if (typeof store.next === "function") {
    store.next(patch);
    return;
  }

  if (typeof store._set === "function") {
    store._set(patch);
  }
};

const ensureNotificationsStore = (
  client?: NotificationsStoreClient | null,
): NotificationStoreLike => {
  const storeCandidate = client?.notifications?.store;
  if (storeCandidate) {
    return storeCandidate as NotificationStoreLike;
  }
  return fallbackNotificationsStore;
};

export type NotificationsStoreParams = {
  client?: NotificationsStoreClient | null;
  notifications?: NotificationsUpdater;
};

export type NotificationsStoreResult = {
  store: StateStore<NotificationManagerState>;
  state: NotificationManagerState;
  notifications: Notification[];
};

const resolveNotificationsStore = ({
  client,
  notifications: updater,
}: NotificationsStoreParams = {}): NotificationsStoreResult => {
  const storeLike = ensureNotificationsStore(client);
  const store = storeLike as StateStore<NotificationManagerState>;

  if (updater !== undefined) {
    const currentState = readNotificationState(storeLike);
    const currentNotifications = notificationArrayFromState(
      currentState.notifications,
    );
    const nextNotifications =
      typeof updater === "function" ? updater(currentNotifications) : updater;
    const normalizedNext = notificationArrayFromState(nextNotifications);

    if (!areNotificationArraysEqual(currentNotifications, normalizedNext)) {
      applyNotificationPatch(storeLike, { notifications: normalizedNext });
    }
  }

  const finalState = readNotificationState(storeLike);
  const finalNotifications = notificationArrayFromState(
    finalState.notifications,
  );

  const originalNotifications = Array.isArray(finalState.notifications)
    ? (finalState.notifications as Notification[])
    : emptyNotificationsState.notifications;

  if (!areNotificationArraysEqual(originalNotifications, finalNotifications)) {
    applyNotificationPatch(storeLike, { notifications: finalNotifications });
  }

  const normalizedState: NotificationManagerState = {
    ...finalState,
    notifications: finalNotifications,
  };

  return {
    store,
    state: normalizedState,
    notifications: normalizedState.notifications,
  };
};

const emitAIIndicatorClear = (
  cid: string,
  channel?: ChannelWithEmitter,
): void => {
  const payload: Record<string, unknown> = { type: 'ai_indicator.clear', cid };

  if (channel?.id) {
    payload.channel_id = channel.id;
  }
  if (channel?.type) {
    payload.channel_type = channel.type;
  }

  channel?.emit?.('ai_indicator.clear', payload);
};

async function stopAIResponse(cid: string): Promise<void> {
  if (typeof cid !== 'string' || !cid) {
    return;
  }

  const channel = getChannelByCid(cid);
  const controller = takeActiveAIResponseController(cid, channel);

  if (controller && !controller.signal.aborted) {
    controller.abort();
  }

  emitAIIndicatorClear(cid, channel);
}

async function stopTyping(): Promise<void> {
  await invokeStopTyping();
}

export const chatAPI = {
  channel: {
    countUnread: channelCountUnread,
    query: channelQuery,
    unpin: channelUnpin,
  },
  search,
  query: queryChannelWatchers,
  on,
  onPollVoteCasted,
  onPollVoteRemoved,
  onPollVoteChanged,
  lastRead,
  clientQueryChannels,
  client: {
    on: clientOnTyped,
    threads: {
      loadNextPage: ({
        client,
        ...args
      }: {
        client: {
          threads?: { loadNextPage?: (options?: unknown) => Promise<unknown> };
        };
      } & Partial<LoadNextPageArgs>) =>
        clientThreadsLoadNextPage(
          client,
          Object.keys(args).length ? (args as LoadNextPageArgs) : undefined,
        ),
      reload: ({
        client,
      }: ClientThreadsReloadInput) => clientThreadsReload(client),
      state: ({ cid, limit, before }: ClientThreadsStateParams) =>
        clientThreadsState({ cid, limit, before }),
    },
  },
  threads: {
    unregisterSubscriptions: threadsUnregisterSubscriptions,
  },
  polls: {
    unregisterSubscriptions: pollsUnregisterSubscriptions,
  },
  addAnswer,
  queryAnswers,
  queryOptionVotes,
  polls_fromState,
  clientThreadsActivate,
  clientThreadsState,
  clientThreadsReload,
  markUnread,
  createReminder,
  reminders: {
    upsertReminder: remindersUpsertReminder,
    unregisterSubscriptions: remindersUnregisterSubscriptions,
    initTimers: remindersInitTimers,
    clearTimers: remindersClearTimers,
    scheduledOffsetsMs: remindersScheduledOffsetsMs,
    deleteReminder,
  },
  stopAIResponse,
  stopTyping,
  notifications: {
    store: resolveNotificationsStore,
  },
  pinMessage,
  unpinMessage,
  flagMessage,
  sendReaction,
  deleteReaction,
  sendAction,
  queryReactions,
  deleteMessage,
  updateMessage,
  muteUser,
  unmuteUser,
  registerSubscriptions,
  endSession,
  getMessage,
  getAppSettings,
  muteStatus,
  listRoomDrafts,
  listUsers,
  listUserAgents,
  setUserAgent,
  syncUser,
};
