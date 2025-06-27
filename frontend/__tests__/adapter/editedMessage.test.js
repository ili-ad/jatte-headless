"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var sampleMessage = {
    id: 'm1',
    text: 'hello',
    user_id: 'u2',
    created_at: '2025-01-01T00:00:00Z',
};
(0, vitest_1.test)('setEditedMessage updates composer state', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    channel.messageComposer.setEditedMessage(sampleMessage);
    (0, vitest_1.expect)(channel.messageComposer.editedMessage).toEqual(sampleMessage);
    (0, vitest_1.expect)(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('hello');
    channel.messageComposer.setEditedMessage(undefined);
    (0, vitest_1.expect)(channel.messageComposer.editedMessage).toBeUndefined();
    (0, vitest_1.expect)(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('');
});
