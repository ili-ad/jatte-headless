"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
// channel() should return a Channel instance with correct cid/id
(0, vitest_1.test)('channel returns Channel with matching cid and default id', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    (0, vitest_1.expect)(channel.cid).toBe('messaging:room1');
    (0, vitest_1.expect)(channel.id).toBe(0);
    (0, vitest_1.expect)(channel.data).toEqual({ name: 'room1' });
    // ensure channel holds reference to client
    // @ts-ignore internal
    (0, vitest_1.expect)(channel['client']).toBe(client);
});
