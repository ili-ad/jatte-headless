"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
(0, vitest_1.test)('getUserAgent returns custom identifier', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    (0, vitest_1.expect)(client.getUserAgent()).toBe('custom-chat-client/0.0.1 stream-chat-react-adapter');
});
