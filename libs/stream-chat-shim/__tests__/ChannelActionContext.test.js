"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var ChannelActionContext_1 = require("../src/ChannelActionContext");
it('provides default empty context', function () {
    var result = (0, react_1.renderHook)(function () { return (0, ChannelActionContext_1.useChannelActionContext)(); }).result;
    expect(result.current).toEqual({});
});
