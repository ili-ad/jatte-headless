"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useCooldownTimer_1 = require("../src/components/MessageInput/hooks/useCooldownTimer");
test('useCooldownTimer exposes cooldown state', function () {
    var result = (0, react_1.renderHook)(function () { return (0, useCooldownTimer_1.useCooldownTimer)(); }).result;
    expect(result.current.cooldownInterval).toBe(0);
    expect(result.current.cooldownRemaining).toBeUndefined();
    (0, react_1.act)(function () {
        result.current.setCooldownRemaining(5);
    });
    expect(result.current.cooldownRemaining).toBe(5);
});
