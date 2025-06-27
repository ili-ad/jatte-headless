"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
/** Ensure initState resets composer and sets edited message */
(0, vitest_1.test)('initState resets stores', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    channel.messageComposer.textComposer.setText('hello');
    channel.messageComposer.setEditedMessage({
        id: 'm0',
        text: 'draft',
        user_id: 'u1',
        created_at: new Date().toISOString(),
    });
    channel.messageComposer.initState();
    (0, vitest_1.expect)(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('');
    (0, vitest_1.expect)(channel.messageComposer.editedMessage).toBeUndefined();
    var msg = { id: 'm1', text: 'bye', user_id: 'u1', created_at: new Date().toISOString() };
    channel.messageComposer.initState({ composition: msg });
    (0, vitest_1.expect)(channel.messageComposer.editedMessage).toEqual(msg);
    (0, vitest_1.expect)(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('bye');
});
