"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUnreadMessagesNotificationVirtualized = void 0;
var react_1 = require("react");
/**
 * Controls the logic when an `UnreadMessagesNotification` component should be shown.
 * In virtualized message list there is no notion of being scrolled below or above `UnreadMessagesSeparator`.
 * Therefore, the `UnreadMessagesNotification` component is rendered based on timestamps.
 * If the there are unread messages in the channel and the `VirtualizedMessageList` renders
 * messages created later than the last read message in the channel, then the
 * `UnreadMessagesNotification` component is rendered. This is an approximate equivalent to being
 * scrolled below the `UnreadMessagesNotification` component.
 * @param lastRead
 * @param showAlways
 * @param unreadCount
 */
var useUnreadMessagesNotificationVirtualized = function (_a) {
    var lastRead = _a.lastRead, showAlways = _a.showAlways, unreadCount = _a.unreadCount;
    var _b = (0, react_1.useState)(false), show = _b[0], setShow = _b[1];
    var toggleShowUnreadMessagesNotification = (0, react_1.useCallback)(function (renderedMessages) {
        var _a, _b;
        if (!unreadCount)
            return;
        var firstRenderedMessage = renderedMessages[0];
        var lastRenderedMessage = renderedMessages.slice(-1)[0];
        if (!(firstRenderedMessage && lastRenderedMessage))
            return;
        var firstRenderedMessageTime = new Date((_a = firstRenderedMessage.created_at) !== null && _a !== void 0 ? _a : 0).getTime();
        var lastRenderedMessageTime = new Date((_b = lastRenderedMessage.created_at) !== null && _b !== void 0 ? _b : 0).getTime();
        var lastReadTime = new Date(lastRead !== null && lastRead !== void 0 ? lastRead : 0).getTime();
        var scrolledBelowSeparator = !!lastReadTime && firstRenderedMessageTime > lastReadTime;
        var scrolledAboveSeparator = !!lastReadTime && lastRenderedMessageTime < lastReadTime;
        setShow(showAlways
            ? scrolledBelowSeparator || scrolledAboveSeparator
            : scrolledBelowSeparator);
    }, [lastRead, showAlways, unreadCount]);
    (0, react_1.useEffect)(function () {
        if (!unreadCount)
            setShow(false);
    }, [unreadCount]);
    return { show: show, toggleShowUnreadMessagesNotification: toggleShowUnreadMessagesNotification };
};
exports.useUnreadMessagesNotificationVirtualized = useUnreadMessagesNotificationVirtualized;
