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
exports.InfiniteScroll = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of InfiniteScroll.
 * Renders children inside a wrapper element while real functionality is ported.
 */
var InfiniteScroll = function (props) {
    var children = props.children, _a = props.element, Component = _a === void 0 ? 'div' : _a, _rest = __rest(props, ["children", "element"]);
    return <Component data-testid="infinite-scroll-placeholder">{children}</Component>;
};
exports.InfiniteScroll = InfiniteScroll;
exports.default = exports.InfiniteScroll;
