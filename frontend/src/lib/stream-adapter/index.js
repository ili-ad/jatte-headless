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
exports.isIntroMessage = exports.makeIntroMessage = exports.CUSTOM_MESSAGE_TYPE = exports.EVENTS = exports.API = exports.ChatClient = void 0;
//frontend/src/lib/stream-adapter/index.ts
__exportStar(require("./types"), exports); // re-export Room / Message / Events
var ChatClient_1 = require("./ChatClient");
Object.defineProperty(exports, "ChatClient", { enumerable: true, get: function () { return ChatClient_1.ChatClient; } });
var constants_1 = require("./constants");
Object.defineProperty(exports, "API", { enumerable: true, get: function () { return constants_1.API; } });
Object.defineProperty(exports, "EVENTS", { enumerable: true, get: function () { return constants_1.EVENTS; } });
var intro_1 = require("./intro");
Object.defineProperty(exports, "CUSTOM_MESSAGE_TYPE", { enumerable: true, get: function () { return intro_1.CUSTOM_MESSAGE_TYPE; } });
Object.defineProperty(exports, "makeIntroMessage", { enumerable: true, get: function () { return intro_1.makeIntroMessage; } });
Object.defineProperty(exports, "isIntroMessage", { enumerable: true, get: function () { return intro_1.isIntroMessage; } });
