"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var renderMessages_1 = require("../src/components/MessageList/renderMessages");
test('returns empty array when no messages', function () {
    var result = (0, renderMessages_1.defaultRenderMessages)({
        components: {},
        lastReceivedMessageId: null,
        messageGroupStyles: {},
        messages: [],
        readData: {},
        sharedMessageProps: {},
    });
    expect(result).toEqual([]);
});
