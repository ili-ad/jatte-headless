"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMessageSetKey_1 = require("../src/useMessageSetKey");
describe('useMessageSetKey', function () {
    it('updates messageSetKey when first message changes', function () {
        var _a = (0, react_1.renderHook)(function (_a) {
            var msgs = _a.msgs;
            return (0, useMessageSetKey_1.useMessageSetKey)({ messages: msgs });
        }, { initialProps: { msgs: [{ id: 'a' }] } }), result = _a.result, rerender = _a.rerender;
        var firstKey = result.current.messageSetKey;
        (0, react_1.act)(function () {
            rerender({ msgs: [{ id: 'b' }] });
        });
        expect(result.current.messageSetKey).not.toBe(firstKey);
    });
    it('keeps messageSetKey when first message remains', function () {
        var _a = (0, react_1.renderHook)(function (_a) {
            var msgs = _a.msgs;
            return (0, useMessageSetKey_1.useMessageSetKey)({ messages: msgs });
        }, { initialProps: { msgs: [{ id: 'a' }, { id: 'b' }] } }), result = _a.result, rerender = _a.rerender;
        var key1 = result.current.messageSetKey;
        (0, react_1.act)(function () {
            rerender({ msgs: [{ id: 'a' }, { id: 'c' }] });
        });
        expect(result.current.messageSetKey).toBe(key1);
    });
});
