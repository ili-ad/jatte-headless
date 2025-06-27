"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messageDraft_1 = require("../src/messageDraft");
test('generates a message draft with defaults', function () {
    var draft = (0, messageDraft_1.generateMessageDraft)({ channel_cid: 'test:1' });
    expect(draft.channel_cid).toBe('test:1');
    expect(draft.message).toBeTruthy();
    expect(draft.created_at).toBeDefined();
});
