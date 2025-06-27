"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEditedTimestamp = MessageEditedTimestamp;
var react_1 = require("react");
var clsx_1 = require("clsx");
var context_1 = require("../../context");
var Timestamp_1 = require("./Timestamp");
var utils_1 = require("./utils");
function MessageEditedTimestamp(_a) {
    var propMessage = _a.message, open = _a.open, timestampProps = __rest(_a, ["message", "open"]);
    var t = (0, context_1.useTranslationContext)('MessageEditedTimestamp').t;
    var contextMessage = (0, context_1.useMessageContext)('MessageEditedTimestamp').message;
    var _b = (0, context_1.useComponentContext)('MessageEditedTimestamp').Timestamp, Timestamp = _b === void 0 ? Timestamp_1.Timestamp : _b;
    var message = propMessage || contextMessage;
    if (!(0, utils_1.isMessageEdited)(message)) {
        return null;
    }
    return (<div className={(0, clsx_1.default)('str-chat__message-edited-timestamp', open
            ? 'str-chat__message-edited-timestamp--open'
            : 'str-chat__message-edited-timestamp--collapsed')} data-testid='message-edited-timestamp'>
      {t('Edited')}{' '}
      <Timestamp timestamp={message.message_text_updated_at} {...timestampProps}/>
    </div>);
}
