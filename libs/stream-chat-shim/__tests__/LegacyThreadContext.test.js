"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var LegacyThreadContext_1 = require("../src/LegacyThreadContext");
describe('LegacyThreadContext', function () {
    it('provides default value', function () {
        var result = (0, react_1.renderHook)(function () { return (0, LegacyThreadContext_1.useLegacyThreadContext)(); }).result;
        expect(result.current).toEqual({ legacyThread: undefined });
    });
});
