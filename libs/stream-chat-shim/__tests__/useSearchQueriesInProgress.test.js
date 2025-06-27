"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useSearchQueriesInProgress_1 = require("../src/useSearchQueriesInProgress");
describe('useSearchQueriesInProgress', function () {
    it('tracks the number of in-flight search queries', function () {
        var result = (0, react_1.renderHook)(function () { return (0, useSearchQueriesInProgress_1.useSearchQueriesInProgress)(); }).result;
        expect(result.current.queriesInProgress).toBe(0);
        (0, react_1.act)(function () {
            result.current.startQuery();
        });
        expect(result.current.queriesInProgress).toBe(1);
        (0, react_1.act)(function () {
            result.current.endQuery();
        });
        expect(result.current.queriesInProgress).toBe(0);
    });
});
