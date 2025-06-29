export async function addAnswer(): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

export async function castVote(
  _optionId: string,
  _messageId: string,
): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

export async function archive(): Promise<void> {
  // Placeholder implementation until backend endpoint is available
}

export function channelCountUnread(
  channel: { countUnread: () => number },
  _lastRead?: Date,
): number {
  return channel.countUnread();
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

export async function channelUnpin(
  channel: { unpin?: () => Promise<any> },
): Promise<any> {
  if (typeof channel.unpin === "function") {
    return channel.unpin();
  }
  return undefined;
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
