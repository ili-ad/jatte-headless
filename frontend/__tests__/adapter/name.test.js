"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
(0, vitest_1.test)('name getter reflects data.name', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    // default name from constructor
    (0, vitest_1.expect)(channel.name).toBe('room1');
    channel.data.name = 'New Name';
    (0, vitest_1.expect)(channel.name).toBe('New Name');
});
