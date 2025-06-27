"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
var originalFetch;
(0, vitest_1.beforeEach)(function () {
    originalFetch = global.fetch;
    global.fetch = vitest_1.vi.fn(function () { return Promise.resolve({ ok: true }); });
});
(0, vitest_1.afterEach)(function () {
    global.fetch = originalFetch;
    vitest_1.vi.restoreAllMocks();
});
/** ensure registerSubscriptions wires store listeners */
(0, vitest_1.test)('registerSubscriptions subscribes and unsubscribes', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    var composer = channel.messageComposer;
    var spy = vitest_1.vi.spyOn(composer, 'logStateUpdateTimestamp');
    var unsubscribe = composer.registerSubscriptions();
    composer.customDataManager.set('foo', 1);
    (0, vitest_1.expect)(spy).toHaveBeenCalledTimes(1);
    unsubscribe();
    composer.customDataManager.set('bar', 2);
    (0, vitest_1.expect)(spy).toHaveBeenCalledTimes(1);
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(constants_1.API.REGISTER_SUBSCRIPTIONS, {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-test' },
    });
});
