var toValidDate = (input) => {
  if (!input)
    return;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
};
  const ownLatestMessageDate = (0, import_react230.useMemo)(() => {
    const channelLatest = toValidDate(latestMessageDatesByChannels[channel.cid]);
    if (channelLatest)
      return channelLatest;
    return messages.map((message) => ({
      message,
      createdAt: toValidDate(message.created_at)
    })).filter(({ message, createdAt }) => (message.user?.id ?? message.user_id) === client.user?.id && createdAt).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).find(Boolean)?.createdAt;
  }, [messages, client.user?.id, latestMessageDatesByChannels, channel.cid]);
