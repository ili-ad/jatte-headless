"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useUserPresenceChangedListener_1 = require("../src/useUserPresenceChangedListener");
test('useUserPresenceChangedListener mounts without errors', function () {
    var result = (0, react_1.renderHook)(function () {
        return (0, useUserPresenceChangedListener_1.useUserPresenceChangedListener)(jest.fn());
    }).result;
    expect(result.error).toBeUndefined();
});
