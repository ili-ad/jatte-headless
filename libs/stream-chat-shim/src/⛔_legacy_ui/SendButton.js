"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendButton = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of the SendButton component.
 * It renders a basic button invoking the provided sendMessage handler.
 */
var SendButton = function (_a) {
    var sendMessage = _a.sendMessage, _b = _a.children, children = _b === void 0 ? 'Send' : _b, rest = __rest(_a, ["sendMessage", "children"]);
    return (<button aria-label="Send" data-testid="send-button" onClick={sendMessage} type="button" {...rest}>
      {children}
    </button>);
};
exports.SendButton = SendButton;
exports.default = exports.SendButton;
