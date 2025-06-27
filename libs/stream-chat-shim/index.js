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
exports.Channel = void 0;
// libs/stream-chat-shim/index.ts
__exportStar(require("./src/Audio"), exports);
__exportStar(require("./src/ChannelList.test"), exports);
__exportStar(require("./src/useChannelDeletedListener"), exports);
__exportStar(require("./src/ChannelListMessenger"), exports);
__exportStar(require("./src/useMentionsHandlers"), exports);
__exportStar(require("./src/channelState"), exports);
var Channel_1 = require("./src/Channel");
Object.defineProperty(exports, "Channel", { enumerable: true, get: function () { return Channel_1.Channel; } });
__exportStar(require("./src/Channel"), exports);
__exportStar(require("./src/AIStateIndicator"), exports);
__exportStar(require("./src/Card"), exports);
__exportStar(require("./src/AttachmentActions"), exports);
