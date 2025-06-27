"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
/** Ensure draft getter/setter mirror text composer */
(0, vitest_1.test)('draft property mirrors text composer', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    // default empty
    (0, vitest_1.expect)(channel.messageComposer.draft).toBe('');
    channel.messageComposer.textComposer.setText('hello');
    (0, vitest_1.expect)(channel.messageComposer.draft).toBe('hello');
    channel.messageComposer.draft = 'bye';
    (0, vitest_1.expect)(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('bye');
});
