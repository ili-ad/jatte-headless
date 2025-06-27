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
exports.MessageTimestamp = void 0;
var react_1 = require("react");
var MessageContext_1 = require("../../context/MessageContext");
var Timestamp_1 = require("./Timestamp");
var context_1 = require("../../context");
var UnMemoizedMessageTimestamp = function (props) {
    var propMessage = props.message, timestampProps = __rest(props, ["message"]);
    var contextMessage = (0, MessageContext_1.useMessageContext)('MessageTimestamp').message;
    var _a = (0, context_1.useComponentContext)('MessageTimestamp').Timestamp, Timestamp = _a === void 0 ? Timestamp_1.Timestamp : _a;
    var message = propMessage || contextMessage;
    return <Timestamp timestamp={message.created_at} {...timestampProps}/>;
};
exports.MessageTimestamp = react_1.default.memo(UnMemoizedMessageTimestamp);
