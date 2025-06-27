"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockClient = mockClient;
exports.getTestClient = getTestClient;
var stream_chat_1 = require("stream-chat");
/**
 * Returns the provided StreamChat client. This placeholder does not apply any
 * mocks. In a real implementation this would attach mock handlers to the
 * client instance.
 */
function mockClient(client, _mocks) {
    return client;
}
/**
 * Creates a StreamChat client instance for use in tests. This placeholder just
 * instantiates the client with a dummy API key and returns it.
 */
function getTestClient(_mocks) {
    var apiKey = 'test';
    var client = new stream_chat_1.StreamChat(apiKey);
    return mockClient(client, _mocks);
}
exports.default = {
    getTestClient: getTestClient,
    mockClient: mockClient,
};
