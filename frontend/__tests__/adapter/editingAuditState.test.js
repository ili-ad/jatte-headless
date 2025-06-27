"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
var constants_1 = require("../../src/lib/stream-adapter/constants");
var originalFetch = global.fetch;
(0, vitest_1.beforeEach)(function () {
    global.fetch = vitest_1.vi.fn(function () { return Promise.resolve({ ok: true }); });
    global.localStorage = { getItem: vitest_1.vi.fn(), setItem: vitest_1.vi.fn(), removeItem: vitest_1.vi.fn() };
});
(0, vitest_1.afterEach)(function () {
    global.fetch = originalFetch;
    delete global.localStorage;
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.test)('editingAuditState updates on text and draft changes', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    var composer = channel.messageComposer;
    var initial = composer.editingAuditState.getSnapshot().lastChange.stateUpdate;
    composer.textComposer.setText('hi');
    var afterText = composer.editingAuditState.getSnapshot().lastChange.stateUpdate;
    (0, vitest_1.expect)(afterText).toBeGreaterThanOrEqual(initial);
    composer.createDraft();
    var last = composer.editingAuditState.getSnapshot().lastChange;
    (0, vitest_1.expect)(last.draftUpdate).not.toBeNull();
    (0, vitest_1.expect)(last.stateUpdate).toBe(last.draftUpdate);
    (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(constants_1.API.EDITING_AUDIT_STATE, vitest_1.expect.objectContaining({ method: 'POST' }));
});
