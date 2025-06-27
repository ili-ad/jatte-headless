"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChatClient_1 = require("../../src/lib/stream-adapter/ChatClient");
/** Ensure config getter mirrors configState */
(0, vitest_1.test)('config reflects configState store', function () {
    var client = new ChatClient_1.ChatClient('u1', 'jwt-test');
    var channel = client.channel('messaging', 'room1');
    // default config
    (0, vitest_1.expect)(channel.messageComposer.config).toEqual({
        attachments: {
            acceptedFiles: [],
            maxNumberOfFilesPerMessage: 10,
        },
        text: { enabled: true },
        multipleUploads: true,
        isUploadEnabled: true,
    });
    // mutate store and expect getter to reflect change
    channel.messageComposer.configState._set({ text: { enabled: false } });
    (0, vitest_1.expect)(channel.messageComposer.config.text.enabled).toBe(false);
});
