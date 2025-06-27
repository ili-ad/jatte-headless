"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMessageListScrollManager_1 = require("../src/useMessageListScrollManager");
describe('useMessageListScrollManager', function () {
    test('returns a callback', function () {
        var result = (0, react_1.renderHook)(function () {
            return (0, useMessageListScrollManager_1.useMessageListScrollManager)({
                loadMoreScrollThreshold: 100,
                messages: [],
                onScrollBy: jest.fn(),
                scrollContainerMeasures: function () { return ({ offsetHeight: 0, scrollHeight: 0 }); },
                scrolledUpThreshold: 50,
                scrollToBottom: jest.fn(),
                showNewMessages: jest.fn(),
            });
        }).result;
        expect(typeof result.current).toBe('function');
    });
});
