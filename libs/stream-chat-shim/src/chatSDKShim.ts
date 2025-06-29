import { noopStore } from 'chat-shim/noopStore';
import type { StateStore } from 'chat-shim';

export async function addAnswer(): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

export async function castVote(
  _optionId: string,
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

export async function channelQuery(
  channel: { query?: (options?: any) => Promise<any> },
  options?: any,
): Promise<any> {
  if (typeof channel.query === "function") {
    return channel.query(options);
  }
  return { messages: [] };
}

export async function channelSendMessage(
  channel: { cid: string },
  message: Record<string, any>,
  _options?: any,
): Promise<any> {
  const resp = await fetch(
    `/api/rooms/${encodeURIComponent(channel.cid)}/messages/`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    },
  );
  return resp.json();
}

export async function channelStateLoadMessageIntoState(
  channel: {
    state?: {
      loadMessageIntoState?: (
        id: string,
        around?: string,
        limit?: number,
      ) => Promise<any>;
    };
  },
  messageId: string,
  around?: string,
  messageLimit?: number,
): Promise<any> {
  if (channel.state?.loadMessageIntoState) {
    return channel.state.loadMessageIntoState(messageId, around, messageLimit);
  }
  return undefined;
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
      createReminder?: (text: string, remind_at: string) => Promise<any>;
    };
  },
  text: string,
  remind_at: string,
): Promise<any> {
  if (client.reminders?.createReminder) {
    return client.reminders.createReminder(text, remind_at);
  }
  const resp = await fetch("/api/reminders/", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, remind_at }),
  });
  return resp.json();
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

export function clientThreadsState(client: {
  threads?: { state?: StateStore<any> };
}): StateStore<any> {
  return client.threads?.state ?? noopStore;
}
