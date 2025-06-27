"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
/** Ensure hasSendableData reflects composer state */
(0, vitest_1.test)('hasSendableData returns true when text or other data present', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    var comp = channel.messageComposer;
    // initially empty
    (0, vitest_1.expect)(comp.hasSendableData).toBe(false);
    // text makes it true
    comp.textComposer.setText('hi');
    (0, vitest_1.expect)(comp.hasSendableData).toBe(true);
    comp.textComposer.clear();
    (0, vitest_1.expect)(comp.hasSendableData).toBe(false);
    // attachments make it true
    comp.attachmentManager.state._set({ attachments: [{ id: 'a1' }] });
    (0, vitest_1.expect)(comp.hasSendableData).toBe(true);
    comp.attachmentManager.state._set({ attachments: [] });
    (0, vitest_1.expect)(comp.hasSendableData).toBe(false);
    // custom data makes it true
    comp.customDataManager.set('foo', 1);
    (0, vitest_1.expect)(comp.hasSendableData).toBe(true);
    comp.customDataManager.clear();
    (0, vitest_1.expect)(comp.hasSendableData).toBe(false);
    // poll data makes it true
    comp.pollComposer.state._set({ poll: { question: 'q1' } });
    (0, vitest_1.expect)(comp.hasSendableData).toBe(true);
});
