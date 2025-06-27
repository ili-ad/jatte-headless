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
exports.ThreadListItemUI = void 0;
var react_1 = require("react");
/** Placeholder implementation of the ThreadListItemUI component. */
var ThreadListItemUI = function (_a) {
    var children = _a.children, rest = __rest(_a, ["children"]);
    return (<button data-testid="thread-list-item-ui-placeholder" type="button" {...rest}>
      {children || 'ThreadListItemUI'}
    </button>);
};
exports.ThreadListItemUI = ThreadListItemUI;
exports.default = exports.ThreadListItemUI;
