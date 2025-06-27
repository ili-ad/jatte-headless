"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreadMessagesSeparator = exports.UNREAD_MESSAGE_SEPARATOR_CLASS = void 0;
var react_1 = require("react");
var context_1 = require("../../context");
exports.UNREAD_MESSAGE_SEPARATOR_CLASS = 'str-chat__unread-messages-separator';
var UnreadMessagesSeparator = function (_a) {
    var showCount = _a.showCount, unreadCount = _a.unreadCount;
    var t = (0, context_1.useTranslationContext)('UnreadMessagesSeparator').t;
    return (<div className={exports.UNREAD_MESSAGE_SEPARATOR_CLASS} data-testid='unread-messages-separator'>
      {unreadCount && showCount
            ? t('unreadMessagesSeparatorText', { count: unreadCount })
            : t('Unread messages')}
    </div>);
};
exports.UnreadMessagesSeparator = UnreadMessagesSeparator;
