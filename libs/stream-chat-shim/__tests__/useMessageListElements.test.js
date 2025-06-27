"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMessageListElements_1 = require("../src/useMessageListElements");
describe('useMessageListElements', function () {
    test('calls renderMessages with provided messages', function () {
        var renderMessages = jest.fn().mockReturnValue(['ok']);
        var props = {
            enrichedMessages: [{ id: '1' }],
            internalMessageProps: { foo: 'bar' },
            messageGroupStyles: {},
            renderMessages: renderMessages,
            returnAllReadData: false,
            threadList: false,
        };
        var result = (0, react_1.renderHook)(function () { return (0, useMessageListElements_1.useMessageListElements)(props); }).result;
        expect(renderMessages).toHaveBeenCalledWith({
            messages: props.enrichedMessages,
            sharedMessageProps: __assign(__assign({}, props.internalMessageProps), { threadList: false }),
        });
        expect(result.current).toEqual(['ok']);
    });
});
