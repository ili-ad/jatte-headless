"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
var originalFetch = global.fetch;
(0, vitest_1.beforeEach)(function () {
    global.fetch = vitest_1.vi.fn(function () { return Promise.resolve({ ok: true }); });
    global.localStorage = { removeItem: vitest_1.vi.fn() };
});
(0, vitest_1.afterEach)(function () {
    global.fetch = originalFetch;
    delete global.localStorage;
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.test)('clear resets composer and deletes draft', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    var comp = channel.messageComposer;
    comp.textComposer.setText('hello');
    comp.customDataManager.set('foo', 1);
    comp.clear();
    (0, vitest_1.expect)(comp.textComposer.state.getSnapshot().text).toBe('');
    (0, vitest_1.expect)(comp.customDataManager.state.getSnapshot().customData).toEqual({});
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith("".concat(constants_1.API.ROOMS, "room1/draft/"), {
        method: 'DELETE',
        headers: { Authorization: 'Bearer jwt-test' },
    });
});
