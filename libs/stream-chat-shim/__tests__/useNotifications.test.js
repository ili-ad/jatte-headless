"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useNotifications_1 = require("../src/useNotifications");
describe('useNotifications', function () {
    test('returns an empty array by default', function () {
        var result = (0, react_1.renderHook)(function () { return (0, useNotifications_1.useNotifications)(); }).result;
        expect(Array.isArray(result.current)).toBe(true);
        expect(result.current.length).toBe(0);
    });
});
