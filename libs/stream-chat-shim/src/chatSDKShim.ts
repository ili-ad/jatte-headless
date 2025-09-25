import { StateStore } from '../../chat-shim';
import { stopTyping as stopTypingImpl } from '../../chat-shim/typing';

import {
  chatAPI,
  type AppSettings,
  type CreateReminderInput,
  type Message as APIMessage,
  type RoomDraft,
} from './api/chatAPI';
import {
  createMessage,
  type CreateMessagePayload,
  type CreateMessageResult,
} from './api/messages';

type SendMessageResponse = { message: CreateMessageResult };

export async function addAnswer(): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

export async function castVote(
  _optionId: string,
  _messageId: string,
): Promise<void> {
  // Placeholder implementation until backend endpoint is available
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

export async function archive(): Promise<void> {
  // Placeholder implementation until backend endpoint is available
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
  channel: { countUnread: () => number },
  _lastRead?: Date,
): number {
  return channel.countUnread();
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
  _user: { id: string },
  jwt: string,
): Promise<any> {
  const resp = await fetch("/api/sync-user/", {
    method: "POST",
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return resp.json();
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
): Promise<{ users: any[] }> {
  const resp = await fetch("/api/users/", { credentials: "same-origin" });
  const data = await resp.json();
  return { users: data };
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
  const resp = await fetch('/api/user-agent/', {
    credentials: 'same-origin',
  });
  const data = await resp.json();
  return data.user_agent;
}

export async function setUserAgent(userAgent: string): Promise<{ status: string }> {
  const resp = await fetch('/api/core-user-agent/', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_agent: userAgent }),
  });
  return resp.json();
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

export async function muteUser(username: string): Promise<void> {
  await fetch(`/api/mute/${encodeURIComponent(username)}/`, {
    method: 'POST',
    credentials: 'same-origin',
  });
}

export async function unmuteUser(username: string): Promise<void> {
  await fetch(`/api/unmute/${encodeURIComponent(username)}/`, {
    method: 'POST',
    credentials: 'same-origin',
  });
}

export async function pollsRegisterSubscriptions(
  client?: { jwt?: string },
): Promise<void> {
  const headers: Record<string, string> = {};
  if (client?.jwt) headers['Authorization'] = `Bearer ${client.jwt}`;
  await fetch('/api/register-subscriptions/', {
    method: 'POST',
    credentials: 'same-origin',
    headers,
  });
}

export async function remindersRegisterSubscriptions(
  client?: { jwt?: string },
): Promise<void> {
  const headers: Record<string, string> = {};
  if (client?.jwt) headers['Authorization'] = `Bearer ${client.jwt}`;
  await fetch('/api/register-subscriptions/', {
    method: 'POST',
    credentials: 'same-origin',
    headers,
  });
}

export async function threadsRegisterSubscriptions(
  client?: { jwt?: string },
): Promise<void> {
  const headers: Record<string, string> = {};
  if (client?.jwt) headers['Authorization'] = `Bearer ${client.jwt}`;
  await fetch('/api/register-subscriptions/', {
    method: 'POST',
    credentials: 'same-origin',
    headers,
  });
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
