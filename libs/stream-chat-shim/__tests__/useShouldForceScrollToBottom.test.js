"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useShouldForceScrollToBottom_1 = require("../src/useShouldForceScrollToBottom");
describe('useShouldForceScrollToBottom', function () {
    test('returns function that detects new own message', function () {
        var messages = [
            { id: '1', user: { id: 'me' } },
        ];
        var result = (0, react_1.renderHook)(function () {
            return (0, useShouldForceScrollToBottom_1.useShouldForceScrollToBottom)(messages, 'me');
        }).result;
        expect(result.current()).toBe(true);
    });
});
