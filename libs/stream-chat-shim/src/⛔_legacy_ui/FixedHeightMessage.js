"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedHeightMessage = void 0;
var react_1 = require("react");
/** Minimal placeholder for Stream's FixedHeightMessage component. */
var FixedHeightMessage = function (_a) {
    var message = _a.message;
    return (<div data-testid="fixed-height-message">{message === null || message === void 0 ? void 0 : message.text}</div>);
};
exports.FixedHeightMessage = FixedHeightMessage;
exports.default = exports.FixedHeightMessage;
