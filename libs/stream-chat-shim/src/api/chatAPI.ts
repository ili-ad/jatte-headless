import {
  chatSDKShim,
  clientQueryChannels as clientQueryChannelsShim,
  clientThreadsActivate as clientThreadsActivateShim,
  clientThreadsLoadNextPage as clientThreadsLoadNextPageShim,
  clientThreadsReload as clientThreadsReloadShim,
  loadMessageIntoChannelState,
} from '../chatSDKShim';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  StreamChat,
} from '../../chat-shim';

export type {
  ClientEventHandler,
  ClientKnownEvent,
  ClientKnownEventMap,
} from '../chatSDKShim';

export type DeleteMessageParams = {
  cid: string;
  message_id: number;
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
  message_id: number;
  text: string;
};

export type CreateReminderInput = {
  cid: string;
  remind_at: string;
  message_id?: number;
  note?: string;
};

export type Reminder = {
  id: number;
  remind_at: string;
  message_id?: number | null;
  note?: string | null;
  created_by: number;
  created_at: string;
};

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
  id: number;
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
  message_id: string;
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

export type ChannelCountUnreadParams = {
  channel: {
    cid: string;
    state?: {
      messages?: Array<Record<string, unknown>>;
      read?: Record<string, unknown>;
      [key: string]: unknown;
    };
    stateStore?: { dispatch?: (patch: unknown) => void } | undefined;
    countUnread?: (lastRead?: Date) => number;
    getClient?: () => unknown;
    [key: string]: unknown;
  };
  lastRead?: Date;
};

export type ClientThreadsActivateInput = {
  client: { threads?: { activate?: () => void } };
};

export type ClientThreadsReloadInput = {
  client: { threads?: { reload?: () => Promise<unknown> } };
};

// shim-only: no network; delegate to SDK shim
export async function addAnswer(input: AddAnswerInput): Promise<AddAnswer> {
  return chatSDKShim.addAnswer(input);
}

export function clientThreadsActivate({
  client,
}: ClientThreadsActivateInput): void {
  clientThreadsActivateShim(client);
}

export async function clientThreadsReload({
  client,
}: ClientThreadsReloadInput): Promise<void> {
  await clientThreadsReloadShim(client);
}

const clientQueryChannels = async ({
  client,
  filters = {},
  sort = {},
  options = {},
}: ClientQueryChannelsParams): Promise<Channel[]> =>
  clientQueryChannelsShim(client, filters, sort, options);

function channelCountUnread({
  channel,
  lastRead,
}: ChannelCountUnreadParams): number {
  return chatSDKShim.channelCountUnread(channel, lastRead);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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

  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${query ? `?${query}` : ""}`,
    {
      method: "GET",
      credentials: "same-origin",
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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

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

type ReactionUserLike = { id?: string | number | null } & Record<string, unknown>;

type ReactionResponseLike = {
  type?: string;
  user?: ReactionUserLike | null;
  user_id?: string | number | null;
  score?: number | string | null;
  message_id?: string | number | null;
  [key: string]: unknown;
};

type ReactionCountsRecord = Record<string, number>;

type ReactionScoresRecord = Record<string, number>;

type ReactionGroupRecord = {
  count?: number | string | null;
  sum_scores?: number | string | null;
  [key: string]: unknown;
};

type ChannelReactionLike = {
  cid?: string;
  state?: { messages?: Array<Record<string, unknown>> | undefined } | null;
  stateStore?: ChannelStateStoreLike | null;
  getClient?: () => { user?: { id?: string | number | null } | null } | null;
  emit?: (event: string, payload: Record<string, unknown>) => void;
};

export type DeleteReactionParams = {
  channel?: ChannelReactionLike | null;
  cid?: string;
  messageId: string | number;
  type: string;
  message?: Record<string, unknown> | null;
  userId?: string | number | null;
};

export type DeleteReactionResult = { message: Record<string, unknown> };

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

export const deleteReaction = async ({
  channel,
  cid,
  message,
  messageId,
  type,
  userId,
}: DeleteReactionParams): Promise<DeleteReactionResult> => {
  const normalizedId = normalizeMessageId(messageId) ?? String(messageId);

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
  const response = await fetch("/api/app-settings/", {
    method: "GET",
    credentials: "same-origin",
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
  const response = await fetch("/api/user-agent/", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch user agent (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<UserAgentInfo>;
  return {
    user_agent: typeof data.user_agent === "string" ? data.user_agent : "",
  };
};

export const setUserAgent = async (
  body: SetUserAgentInput = {},
): Promise<UserAgentInfo> => {
  const payload = { ...body };
  const hasBody = Object.keys(payload).length > 0;
  const options: RequestInit = {
    method: "POST",
    credentials: "same-origin",
  };

  if (hasBody) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(payload);
  }

  const response = await fetch("/api/user-agent/", options);

  if (!response.ok) {
    const error = new Error(
      `Failed to set user agent (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<UserAgentInfo>;
  if (typeof data.user_agent !== "string") {
    throw new Error("Invalid user agent response");
  }

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
    credentials: "same-origin",
  };

  if (Object.keys(headers).length > 0) {
    options.headers = headers;
  }

  if (payloadKeys.length > 0) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch("/api/sync-user/", options);

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
  const response = await fetch('/api/register-subscriptions/', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch("/api/users/", {
    method: "GET",
    credentials: "same-origin",
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
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "DELETE",
      credentials: "same-origin",
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
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "PATCH",
      credentials: "same-origin",
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

  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/mutes/`,
    {
      method: "POST",
      credentials: "same-origin",
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
  const response = await fetch("/api/user-mutes/unmute/", {
    method: "POST",
    credentials: "same-origin",
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
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/mute/`,
    {
      method: "GET",
      credentials: "same-origin",
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
  message_id: number;
}): Promise<Message> => {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "GET",
      credentials: "same-origin",
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
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(room_uuid)}/draft/`,
    {
      method: 'GET',
      credentials: 'same-origin',
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

async function createReminder(body: CreateReminderInput): Promise<Reminder> {
  const response = await fetch("/api/reminders/", {
    method: "POST",
    credentials: "same-origin",
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

async function endSession(): Promise<void> {
  const response = await fetch("/api/session/", {
    method: "DELETE",
    credentials: "same-origin",
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

export const chatAPI = {
  channel: {
    countUnread: channelCountUnread,
    query: channelQuery,
    unpin: channelUnpin,
  },
  clientQueryChannels,
  client: {
    on: chatSDKShim.client.on,
    threads: {
      loadNextPage: ({
        client,
        ...args
      }: {
        client: {
          threads?: { loadNextPage?: (options?: unknown) => Promise<unknown> };
        };
      } & Partial<LoadNextPageArgs>) =>
        clientThreadsLoadNextPageShim(
          client,
          Object.keys(args).length ? (args as LoadNextPageArgs) : undefined,
        ),
      reload: ({
        client,
      }: ClientThreadsReloadInput) => clientThreadsReloadShim(client),
      state: ({ cid, limit, before }: ClientThreadsStateParams) =>
        clientThreadsState({ cid, limit, before }),
    },
  },
  addAnswer,
  clientThreadsActivate,
  clientThreadsState,
  clientThreadsReload,
  createReminder,
  flagMessage,
  deleteReaction,
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
