var toDateBucket = (value) => {
  if (!value) return void 0;
  const date = isDate(value) ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return void 0;
  return Math.floor(date.getTime() / 1e3);
};
var messageIdentityKey = (message) => {
  const text = typeof message.text === "string" ? message.text : typeof message.body === "string" ? message.body : "";
  const userId = message.user?.id || message.user_id || "";
  const bucket = toDateBucket(message.created_at);
  if (!text && !userId && bucket === void 0) return void 0;
  return `${userId}|${text}|${bucket ?? ""}`;
};
var preferIncomingMessage = (current, incoming) => {
  const currentId = current.id;
  const incomingId = incoming.id;
  const currentStatus = current.status;
  const incomingStatus = incoming.status;
  const currentIsLocal = typeof currentId === "string" && currentId.startsWith("local-");
  const incomingIsLocal = typeof incomingId === "string" && incomingId.startsWith("local-");
  if (currentIsLocal && !incomingIsLocal) return true;
  if (currentStatus === "sending" && incomingStatus && incomingStatus !== "sending")
    return true;
  return false;
};
var dedupeMessages = (messages) => {
  const unique = /* @__PURE__ */ new Map();
  const fallbacks = [];
  for (const message of messages) {
    const key = messageIdentityKey(message);
    if (!key) {
      fallbacks.push(message);
      continue;
    }
    const existing = unique.get(key);
    if (!existing || preferIncomingMessage(existing, message)) {
      unique.set(key, message);
    }
  }
  return [...unique.values(), ...fallbacks];
};
  const normalizedMessages = dedupeMessages(messages);
  for (let i = 0; i < normalizedMessages.length; i += 1) {
    const message = normalizedMessages[i];
    const previousMessage = normalizedMessages[i - 1];
        messages: normalizedMessages,
var toValidDate = (input) => {
  if (!input)
    return;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? void 0 : date;
};
  const ownLatestMessageDate = (0, import_react231.useMemo)(() => {
    const channelLatest = toValidDate(latestMessageDatesByChannels[channel.cid]);
    if (channelLatest)
      return channelLatest;
    return messages.map((message) => ({
      message,
      createdAt: toValidDate(message.created_at)
    })).filter(({ message, createdAt }) => (message.user?.id ?? message.user_id) === client.user?.id && createdAt).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).find(Boolean)?.createdAt;
  }, [messages, client.user?.id, latestMessageDatesByChannels, channel.cid]);
