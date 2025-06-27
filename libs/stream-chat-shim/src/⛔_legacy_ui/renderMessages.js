"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRenderMessages = void 0;
var react_1 = require("react");
/**
 * Minimal placeholder implementation of Stream's renderMessages utility.
 * Each message is rendered as a simple list item.
 */
var defaultRenderMessages = function (_a) {
    var messages = _a.messages;
    return messages.map(function (message) { return (<li key={message.id || message.created_at}>Placeholder message</li>); });
};
exports.defaultRenderMessages = defaultRenderMessages;
exports.default = exports.defaultRenderMessages;
