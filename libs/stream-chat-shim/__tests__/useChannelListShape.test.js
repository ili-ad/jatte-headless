"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useChannelListShape_1 = require("../src/useChannelListShape");
describe('useChannelListShape', function () {
    test('returns undefined', function () {
        var result = (0, react_1.renderHook)(function () { return (0, useChannelListShape_1.useChannelListShape)(function () { }, as, any); }).result;
        expect(result.current).toBeUndefined();
    });
});
