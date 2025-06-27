"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
var originalFetch = global.fetch;
(0, vitest_1.beforeEach)(function () {
    global.fetch = vitest_1.vi.fn(function () { return Promise.resolve({ ok: true }); });
});
(0, vitest_1.afterEach)(function () {
    global.fetch = originalFetch;
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.test)('disconnectUser clears state and notifies backend', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    client.disconnectUser();
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(constants_1.API.SESSION, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer jwt-test' },
    });
    (0, vitest_1.expect)(client.user).toBeUndefined();
    (0, vitest_1.expect)(client.jwt).toBeNull();
    (0, vitest_1.expect)(client.stateStore.getSnapshot().channels).toEqual([]);
});
