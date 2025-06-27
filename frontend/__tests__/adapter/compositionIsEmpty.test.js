"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
/** Ensure compositionIsEmpty reflects text composer state */
(0, vitest_1.test)('compositionIsEmpty mirrors text composer', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    // initially empty
    (0, vitest_1.expect)(channel.messageComposer.compositionIsEmpty).toBe(true);
    // after setting text it becomes false
    channel.messageComposer.textComposer.setText('hello');
    (0, vitest_1.expect)(channel.messageComposer.compositionIsEmpty).toBe(false);
    // clearing returns to true
    channel.messageComposer.textComposer.clear();
    (0, vitest_1.expect)(channel.messageComposer.compositionIsEmpty).toBe(true);
});
