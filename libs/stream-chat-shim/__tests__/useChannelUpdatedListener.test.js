"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useChannelUpdatedListener_1 = require("../src/useChannelUpdatedListener");
describe('useChannelUpdatedListener', function () {
    test('can be invoked without errors', function () {
        var setChannels = (function () { });
        var result = (0, react_1.renderHook)(function () { return (0, useChannelUpdatedListener_1.useChannelUpdatedListener)(setChannels); }).result;
        expect(result.current).toBeUndefined();
    });
});
