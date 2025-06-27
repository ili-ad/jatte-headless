"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMarkUnreadHandler_1 = require("../src/useMarkUnreadHandler");
describe('useMarkUnreadHandler', function () {
    test('throws when invoked', function () {
        var result = (0, react_1.renderHook)(function () { return (0, useMarkUnreadHandler_1.useMarkUnreadHandler)(); }).result;
        expect(function () { return result.current({ preventDefault: function () { } }); }).toThrow('useMarkUnreadHandler not implemented');
    });
});
