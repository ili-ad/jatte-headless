"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCooldownTimer = void 0;
var react_1 = require("react");
/**
 * Minimal placeholder for Stream's `useCooldownTimer` hook.
 * Provides cooldown state but omits integration with Stream Chat contexts.
 */
var useCooldownTimer = function () {
    var _a = (0, react_1.useState)(), cooldownRemaining = _a[0], setCooldownRemaining = _a[1];
    return {
        cooldownInterval: 0,
        cooldownRemaining: cooldownRemaining,
        setCooldownRemaining: setCooldownRemaining,
    };
};
exports.useCooldownTimer = useCooldownTimer;
exports.default = exports.useCooldownTimer;
