"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
var message = { id: 'm1', text: 'hi', user_id: 'u2', created_at: '2025-01-01T00:00:00Z' };
var originalFetch = global.fetch;
(0, vitest_1.beforeEach)(function () {
    global.fetch = vitest_1.vi.fn(function () { return Promise.resolve({ ok: true }); });
});
(0, vitest_1.afterEach)(function () {
    global.fetch = originalFetch;
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.test)('dispatchEvent forwards message.new to channel and client', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    // mark as active channel so dispatchEvent can find it
    client.activeChannels[channel.cid] = channel;
    var clientSpy = vitest_1.vi.fn();
    var chanSpy = vitest_1.vi.fn();
    client.on(constants_1.EVENTS.MESSAGE_NEW, clientSpy);
    channel.on(constants_1.EVENTS.MESSAGE_NEW, chanSpy);
    client.dispatchEvent({ type: constants_1.EVENTS.MESSAGE_NEW, cid: channel.cid, message: message });
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith("/api".concat(constants_1.API.DISPATCH_EVENT), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer jwt-test',
        },
        body: JSON.stringify({ type: constants_1.EVENTS.MESSAGE_NEW, cid: channel.cid, message: message }),
    });
    (0, vitest_1.expect)(channel.state.messages.at(-1)).toEqual(message);
    (0, vitest_1.expect)(clientSpy).toHaveBeenCalledWith({ type: constants_1.EVENTS.MESSAGE_NEW, cid: channel.cid, message: message });
    (0, vitest_1.expect)(chanSpy).toHaveBeenCalledWith({ type: constants_1.EVENTS.MESSAGE_NEW, cid: channel.cid, message: message });
});
(0, vitest_1.test)('dispatchEvent forwards typing events', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    client.activeChannels[channel.cid] = channel;
    var clientSpy = vitest_1.vi.fn();
    var chanSpy = vitest_1.vi.fn();
    client.on('typing.start', clientSpy);
    channel.on('typing.start', chanSpy);
    client.dispatchEvent({ type: 'typing.start', cid: channel.cid, user_id: 'u2' });
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith("/api".concat(constants_1.API.DISPATCH_EVENT), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer jwt-test',
        },
        body: JSON.stringify({ type: 'typing.start', cid: channel.cid, user_id: 'u2' }),
    });
    (0, vitest_1.expect)(clientSpy).toHaveBeenCalledWith({ type: 'typing.start', cid: channel.cid, user_id: 'u2' });
    (0, vitest_1.expect)(chanSpy).toHaveBeenCalledWith({ type: 'typing.start', cid: channel.cid, user_id: 'u2' });
});
