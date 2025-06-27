"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreadMessagesNotification = void 0;
var react_1 = require("react");
var icons_1 = require("./icons");
var context_1 = require("../../context");
var UnreadMessagesNotification = function (_a) {
    var queryMessageLimit = _a.queryMessageLimit, showCount = _a.showCount, unreadCount = _a.unreadCount;
    var _b = (0, context_1.useChannelActionContext)('UnreadMessagesNotification'), jumpToFirstUnreadMessage = _b.jumpToFirstUnreadMessage, markRead = _b.markRead;
    var t = (0, context_1.useTranslationContext)('UnreadMessagesNotification').t;
    return (<div className='str-chat__unread-messages-notification' data-testid='unread-messages-notification'>
      <button onClick={function () { return jumpToFirstUnreadMessage(queryMessageLimit); }}>
        {unreadCount && showCount
            ? t('{{count}} unread', { count: unreadCount !== null && unreadCount !== void 0 ? unreadCount : 0 })
            : t('Unread messages')}
      </button>
      <button onClick={function () { return markRead(); }}>
        <icons_1.CloseIcon />
      </button>
    </div>);
};
exports.UnreadMessagesNotification = UnreadMessagesNotification;
