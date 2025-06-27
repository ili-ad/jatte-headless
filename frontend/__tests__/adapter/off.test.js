"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
// off.test.ts - ensures off removes listener
(0, vitest_1.test)('off removes event listener', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var spy = vitest_1.vi.fn();
    client.on(constants_1.EVENTS.MESSAGE_NEW, spy);
    client.off(constants_1.EVENTS.MESSAGE_NEW, spy);
    client.emit(constants_1.EVENTS.MESSAGE_NEW, { message: { id: 'm1', text: 'x', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' } });
    (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
});
