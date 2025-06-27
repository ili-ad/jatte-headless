"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var usePollAnswerPagination_1 = require("../src/usePollAnswerPagination");
describe('usePollAnswerPagination', function () {
    test('returns placeholder values and loadMore throws', function () {
        var result = (0, react_1.renderHook)(function () { return (0, usePollAnswerPagination_1.usePollAnswerPagination)(); }).result;
        expect(result.current.answers).toEqual([]);
        expect(result.current.hasNextPage).toBe(true);
        expect(function () { return result.current.loadMore(); }).toThrow('usePollAnswerPagination not implemented');
    });
});
