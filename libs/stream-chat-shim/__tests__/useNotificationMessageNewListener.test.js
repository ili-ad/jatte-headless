"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useNotificationMessageNewListener_1 = require("../src/useNotificationMessageNewListener");
describe('useNotificationMessageNewListener', function () {
    it('initialises without crashing', function () {
        var setChannels = jest.fn();
        var result = (0, react_1.renderHook)(function () {
            return (0, useNotificationMessageNewListener_1.useNotificationMessageNewListener)(setChannels);
        }).result;
        expect(result.current).toBeUndefined();
    });
});
