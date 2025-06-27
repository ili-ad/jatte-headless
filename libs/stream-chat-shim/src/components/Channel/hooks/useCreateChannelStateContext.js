"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCreateChannelStateContext = void 0;
var react_1 = require("react");
var i18n_1 = require("../../../i18n");
var useCreateChannelStateContext = function (value) {
    var _a, _b;
    var channel = value.channel, _c = value.channelCapabilitiesArray, channelCapabilitiesArray = _c === void 0 ? [] : _c, channelConfig = value.channelConfig, channelUnreadUiState = value.channelUnreadUiState, error = value.error, giphyVersion = value.giphyVersion, hasMore = value.hasMore, hasMoreNewer = value.hasMoreNewer, highlightedMessageId = value.highlightedMessageId, imageAttachmentSizeHandler = value.imageAttachmentSizeHandler, loading = value.loading, loadingMore = value.loadingMore, members = value.members, _d = value.messages, messages = _d === void 0 ? [] : _d, mutes = value.mutes, notifications = value.notifications, pinnedMessages = value.pinnedMessages, _e = value.read, read = _e === void 0 ? {} : _e, shouldGenerateVideoThumbnail = value.shouldGenerateVideoThumbnail, skipMessageDataMemoization = value.skipMessageDataMemoization, suppressAutoscroll = value.suppressAutoscroll, thread = value.thread, threadHasMore = value.threadHasMore, threadLoadingMore = value.threadLoadingMore, _f = value.threadMessages, threadMessages = _f === void 0 ? [] : _f, videoAttachmentSizeHandler = value.videoAttachmentSizeHandler, watcher_count = value.watcher_count, watcherCount = value.watcherCount, watchers = value.watchers;
    var channelId = channel.cid;
    var lastRead = channel.initialized && ((_a = channel.lastRead()) === null || _a === void 0 ? void 0 : _a.getTime());
    var membersLength = Object.keys(members || []).length;
    var notificationsLength = notifications.length;
    var readUsers = Object.values(read);
    var readUsersLength = readUsers.length;
    var readUsersLastReads = readUsers
        .map(function (_a) {
        var last_read = _a.last_read;
        return last_read.toISOString();
    })
        .join();
    var threadMessagesLength = threadMessages === null || threadMessages === void 0 ? void 0 : threadMessages.length;
    var channelCapabilities = {};
    channelCapabilitiesArray.forEach(function (capability) {
        channelCapabilities[capability] = true;
    });
    var memoizedMessageData = skipMessageDataMemoization
        ? messages
        : messages
            .map(function (_a) {
            var deleted_at = _a.deleted_at, latest_reactions = _a.latest_reactions, pinned = _a.pinned, reply_count = _a.reply_count, status = _a.status, updated_at = _a.updated_at, user = _a.user;
            return "".concat(deleted_at).concat(latest_reactions ? latest_reactions.map(function (_a) {
                var type = _a.type;
                return type;
            }).join() : '').concat(pinned).concat(reply_count).concat(status).concat(updated_at && ((0, i18n_1.isDayOrMoment)(updated_at) || (0, i18n_1.isDate)(updated_at))
                ? updated_at.toISOString()
                : updated_at || '').concat(user === null || user === void 0 ? void 0 : user.updated_at);
        })
            .join();
    var memoizedThreadMessageData = threadMessages
        .map(function (_a) {
        var deleted_at = _a.deleted_at, latest_reactions = _a.latest_reactions, pinned = _a.pinned, status = _a.status, updated_at = _a.updated_at, user = _a.user;
        return "".concat(deleted_at).concat(latest_reactions ? latest_reactions.map(function (_a) {
            var type = _a.type;
            return type;
        }).join() : '').concat(pinned).concat(status).concat(updated_at && ((0, i18n_1.isDayOrMoment)(updated_at) || (0, i18n_1.isDate)(updated_at))
            ? updated_at.toISOString()
            : updated_at || '').concat(user === null || user === void 0 ? void 0 : user.updated_at);
    })
        .join();
    var channelStateContext = (0, react_1.useMemo)(function () { return ({
        channel: channel,
        channelCapabilities: channelCapabilities,
        channelConfig: channelConfig,
        channelUnreadUiState: channelUnreadUiState,
        error: error,
        giphyVersion: giphyVersion,
        hasMore: hasMore,
        hasMoreNewer: hasMoreNewer,
        highlightedMessageId: highlightedMessageId,
        imageAttachmentSizeHandler: imageAttachmentSizeHandler,
        loading: loading,
        loadingMore: loadingMore,
        members: members,
        messages: messages,
        mutes: mutes,
        notifications: notifications,
        pinnedMessages: pinnedMessages,
        read: read,
        shouldGenerateVideoThumbnail: shouldGenerateVideoThumbnail,
        suppressAutoscroll: suppressAutoscroll,
        thread: thread,
        threadHasMore: threadHasMore,
        threadLoadingMore: threadLoadingMore,
        threadMessages: threadMessages,
        videoAttachmentSizeHandler: videoAttachmentSizeHandler,
        watcher_count: watcher_count,
        watcherCount: watcherCount,
        watchers: watchers,
    }); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        (_b = channel.data) === null || _b === void 0 ? void 0 : _b.name, // otherwise ChannelHeader will not be updated
        channelId,
        channelUnreadUiState,
        error,
        hasMore,
        hasMoreNewer,
        highlightedMessageId,
        lastRead,
        loading,
        loadingMore,
        membersLength,
        memoizedMessageData,
        memoizedThreadMessageData,
        notificationsLength,
        readUsersLength,
        readUsersLastReads,
        shouldGenerateVideoThumbnail,
        skipMessageDataMemoization,
        suppressAutoscroll,
        thread,
        threadHasMore,
        threadLoadingMore,
        threadMessagesLength,
        watcherCount,
    ]);
    return channelStateContext;
};
exports.useCreateChannelStateContext = useCreateChannelStateContext;
