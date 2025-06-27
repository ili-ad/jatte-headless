"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mock_index_1 = require("../src/mock-index");
var stream_chat_1 = require("stream-chat");
describe('mock-index shim', function () {
    it('creates a StreamChat instance', function () {
        var client = (0, mock_index_1.getTestClient)();
        expect(client).toBeInstanceOf(stream_chat_1.StreamChat);
    });
    it('returns same client from mockClient', function () {
        var original = new stream_chat_1.StreamChat('test');
        var wrapped = (0, mock_index_1.mockClient)(original);
        expect(wrapped).toBe(original);
    });
});
