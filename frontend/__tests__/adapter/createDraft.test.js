"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
var setItemSpy;
var originalFetch = global.fetch;
(0, vitest_1.beforeEach)(function () {
    setItemSpy = vitest_1.vi.fn();
    global.localStorage = {
        getItem: vitest_1.vi.fn(),
        setItem: setItemSpy,
        removeItem: vitest_1.vi.fn(),
    };
    global.fetch = vitest_1.vi.fn(function () { return Promise.resolve({ ok: true }); });
});
(0, vitest_1.afterEach)(function () {
    delete global.localStorage;
    global.fetch = originalFetch;
});
(0, vitest_1.test)('createDraft saves current text to localStorage and posts draft', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    channel.messageComposer.textComposer.setText('draft message');
    channel.messageComposer.createDraft();
    (0, vitest_1.expect)(setItemSpy).toHaveBeenCalledWith('draft:room1', 'draft message');
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith("".concat(constants_1.API.ROOMS, "room1/draft/"), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer jwt-test',
        },
        body: JSON.stringify({ text: 'draft message' }),
    });
});
