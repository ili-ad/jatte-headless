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
  if (typeof channel.getReplies === 'function') {
    return channel.getReplies(parentId, options);
  }
  return { messages: [] };
}

export async function channelMarkRead(
  channel: { markRead?: () => Promise<any> },
): Promise<any> {
  if (typeof channel.markRead === 'function') {
    return channel.markRead();
  }
  return undefined;
}
