"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useChat_1 = require("../src/useChat");
describe('useChat', function () {
    test('sets active channel', function () {
        var client = {};
        var result = (0, react_1.renderHook)(function () { return (0, useChat_1.useChat)({ client: client }); }).result;
        expect(result.current.channel).toBeUndefined();
        (0, react_1.act)(function () {
            result.current.setActiveChannel({ id: 'test' });
        });
        expect(result.current.channel).toEqual({ id: 'test' });
    });
    test('toggles mobile nav', function () {
        var client = {};
        var result = (0, react_1.renderHook)(function () { return (0, useChat_1.useChat)({ client: client, initialNavOpen: false }); }).result;
        (0, react_1.act)(function () {
            result.current.openMobileNav();
        });
        expect(result.current.navOpen).toBe(true);
        (0, react_1.act)(function () {
            result.current.closeMobileNav();
        });
        expect(result.current.navOpen).toBe(false);
    });
});
