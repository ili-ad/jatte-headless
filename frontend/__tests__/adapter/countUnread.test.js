"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
// countUnread depends only on local state
(0, vitest_1.test)('countUnread returns 0 when no read data', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    (0, vitest_1.expect)(channel.countUnread()).toBe(0);
});
(0, vitest_1.test)('countUnread returns unread_messages for current user', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    // inject unread state
    channel.state.read['u1'] = {
        last_read: '2024-01-01T00:00:00Z',
        unread_messages: 3,
    };
    (0, vitest_1.expect)(channel.countUnread()).toBe(3);
});
