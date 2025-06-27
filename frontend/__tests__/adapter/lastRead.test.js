"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
// lastRead depends only on local state
(0, vitest_1.test)('lastRead returns undefined when no read data', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    (0, vitest_1.expect)(channel.lastRead()).toBeUndefined();
});
(0, vitest_1.test)('lastRead returns Date for current user', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    channel.state.read['u1'] = {
        last_read: '2024-01-01T00:00:00Z',
        unread_messages: 0,
    };
    var val = channel.lastRead();
    (0, vitest_1.expect)(val).toBeInstanceOf(Date);
    (0, vitest_1.expect)(val === null || val === void 0 ? void 0 : val.toISOString()).toBe('2024-01-01T00:00:00.000Z');
});
