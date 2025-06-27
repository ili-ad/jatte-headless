"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageInput = exports.MessageList = exports.Window = exports.Channel = exports.Chat = void 0;
// Ultra-minimal stub for MVP build
// Provide tiny React components so the demo compiles without the real package
var react_1 = require("react");
var Chat = function (_a) {
    var children = _a.children;
    return react_1.default.createElement('div', null, children);
};
exports.Chat = Chat;
var Channel = function (_a) {
    var children = _a.children;
    return react_1.default.createElement('div', null, children);
};
exports.Channel = Channel;
var Window = function (_a) {
    var children = _a.children;
    return react_1.default.createElement('div', null, children);
};
exports.Window = Window;
var MessageList = function () { return null; };
exports.MessageList = MessageList;
var MessageInput = function () { return null; };
exports.MessageInput = MessageInput;
exports.default = {};
__exportStar(require("stream-chat-react"), exports);
