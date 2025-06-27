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
var sampleMessage = {
    id: 'm1',
    text: 'hello',
    user_id: 'u2',
    created_at: '2025-01-01T00:00:00Z',
};
(0, vitest_1.test)('setQuotedMessage updates composer state and posts message', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    channel.messageComposer.setQuotedMessage(sampleMessage);
    (0, vitest_1.expect)(channel.messageComposer.state.getSnapshot().quotedMessage).toEqual(sampleMessage);
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(constants_1.API.QUOTED_MESSAGE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer jwt-test',
        },
        body: JSON.stringify({ quoted_message: sampleMessage }),
    });
    channel.messageComposer.setQuotedMessage(undefined);
    (0, vitest_1.expect)(channel.messageComposer.state.getSnapshot().quotedMessage).toBeUndefined();
    (0, vitest_1.expect)(global.fetch).toHaveBeenLastCalledWith(constants_1.API.QUOTED_MESSAGE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer jwt-test',
        },
        body: JSON.stringify({ quoted_message: null }),
    });
});
