"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useChannelHiddenListener_1 = require("../src/useChannelHiddenListener");
it('renders without crashing', function () {
    var setChannels = jest.fn();
    var result = (0, react_1.renderHook)(function () {
        return (0, useChannelHiddenListener_1.useChannelHiddenListener)(setChannels);
    }).result;
    expect(result.error).toBeUndefined();
});
