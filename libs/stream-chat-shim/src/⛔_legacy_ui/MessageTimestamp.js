"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTimestamp = MessageTimestamp;
// libs/stream-chat-shim/src/MessageTimestamp.tsx
var react_1 = require("react");
/**
 * Placeholder implementation of the MessageTimestamp component.
 * It simply renders the message creation date.
 */
function MessageTimestamp(_a) {
    var _b, _c, _d;
    var customClass = _a.customClass, message = _a.message;
    var timestamp = typeof (message === null || message === void 0 ? void 0 : message.created_at) === 'string'
        ? message === null || message === void 0 ? void 0 : message.created_at
        : (_d = (_c = (_b = message === null || message === void 0 ? void 0 : message.created_at) === null || _b === void 0 ? void 0 : _b.toISOString) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : '';
    if (!timestamp)
        return null;
    return (<time className={customClass} dateTime={timestamp} title={timestamp}>
      {timestamp}
    </time>);
}
exports.default = MessageTimestamp;
