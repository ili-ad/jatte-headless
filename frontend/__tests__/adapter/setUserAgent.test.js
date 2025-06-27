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
(0, vitest_1.test)('setUserAgent updates returned user agent and posts to backend', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    client.setUserAgent('my-agent/1.0');
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(constants_1.API.USER_AGENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-test' },
        body: JSON.stringify({ user_agent: 'my-agent/1.0' }),
    });
    (0, vitest_1.expect)(client.getUserAgent()).toBe('my-agent/1.0');
});
