"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var channelState_1 = require("../src/channelState");
describe('channelState shim', function () {
    test('makeChannelReducer returns a reducer function', function () {
        var reducer = (0, channelState_1.makeChannelReducer)();
        expect(typeof reducer).toBe('function');
        var state = { v: 1 };
        expect(reducer(state, { type: 'x' })).toBe(state);
    });
    test('initialState has basic fields', function () {
        expect(channelState_1.initialState).toHaveProperty('loading');
        expect(channelState_1.initialState).toHaveProperty('messages');
    });
});
