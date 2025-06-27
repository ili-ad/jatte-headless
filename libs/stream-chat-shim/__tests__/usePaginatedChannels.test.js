"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var usePaginatedChannels_1 = require("../src/usePaginatedChannels");
var noop = function () { };
describe('usePaginatedChannels', function () {
    test('returns placeholder structure', function () {
        var client = {};
        var result = (0, react_1.renderHook)(function () {
            return (0, usePaginatedChannels_1.usePaginatedChannels)(client, {}, {}, {}, noop);
        }).result;
        expect(Array.isArray(result.current.channels)).toBe(true);
        expect(typeof result.current.hasNextPage).toBe('boolean');
        expect(function () { return result.current.loadNextPage(); }).toThrow('usePaginatedChannels not implemented');
    });
});
