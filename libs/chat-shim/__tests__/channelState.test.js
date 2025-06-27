"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('ChannelState', function () {
    test('countUnread returns 0 when user missing', function () {
        var state = new index_1.ChannelState();
        state.read = {};
        expect(state.countUnread('u1')).toBe(0);
    });
    test('countUnread returns unread_messages', function () {
        var state = new index_1.ChannelState();
        state.read = { u1: { unread_messages: 2 } };
        expect(state.countUnread('u1')).toBe(2);
    });
});
