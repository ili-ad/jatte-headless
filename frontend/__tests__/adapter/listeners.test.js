"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
(0, vitest_1.test)('on stores listener in listeners map', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var spy = vitest_1.vi.fn();
    client.on(constants_1.EVENTS.MESSAGE_NEW, spy);
    (0, vitest_1.expect)(client.listeners[constants_1.EVENTS.MESSAGE_NEW]).toContain(spy);
});
(0, vitest_1.test)('off removes listener from listeners map', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var spy = vitest_1.vi.fn();
    client.on(constants_1.EVENTS.MESSAGE_NEW, spy);
    client.off(constants_1.EVENTS.MESSAGE_NEW, spy);
    (0, vitest_1.expect)(client.listeners[constants_1.EVENTS.MESSAGE_NEW] || []).not.toContain(spy);
});
