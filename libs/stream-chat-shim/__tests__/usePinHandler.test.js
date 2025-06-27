"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var usePinHandler_1 = require("../src/usePinHandler");
describe('usePinHandler', function () {
    test('returns placeholder handler', function () {
        var result = (0, react_1.renderHook)(function () { return (0, usePinHandler_1.usePinHandler)({}); }).result;
        expect(result.current.canPin).toBe(false);
        expect(function () { return result.current.handlePin({}); }).toThrow('usePinHandler not implemented');
    });
});
