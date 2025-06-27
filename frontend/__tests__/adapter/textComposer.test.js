"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
/** Ensure textComposer manages basic text state */
(0, vitest_1.test)('textComposer setText, setSelection, clear', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var comp = client.channel('messaging', 'room1').messageComposer.textComposer;
    (0, vitest_1.expect)(comp.state.getSnapshot().text).toBe('');
    comp.setText('hi');
    (0, vitest_1.expect)(comp.state.getSnapshot().text).toBe('hi');
    comp.setSelection({ start: 0, end: 2 });
    (0, vitest_1.expect)(comp.state.getSnapshot().selection).toEqual({ start: 0, end: 2 });
    comp.clear();
    (0, vitest_1.expect)(comp.state.getSnapshot().text).toBe('');
});
