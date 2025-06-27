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
exports.PopperTooltip = exports.Tooltip = void 0;
var react_1 = require("react");
var react_popper_1 = require("react-popper");
var Tooltip = function (_a) {
    var children = _a.children, rest = __rest(_a, ["children"]);
    return (<div className='str-chat__tooltip' {...rest}>
    {children}
  </div>);
};
exports.Tooltip = Tooltip;
var PopperTooltip = function (_a) {
    var children = _a.children, _b = _a.offset, offset = _b === void 0 ? [0, 10] : _b, _c = _a.placement, placement = _c === void 0 ? 'top' : _c, referenceElement = _a.referenceElement, _d = _a.visible, visible = _d === void 0 ? false : _d;
    var _e = (0, react_1.useState)(null), popperElement = _e[0], setPopperElement = _e[1];
    var _f = (0, react_popper_1.usePopper)(referenceElement, popperElement, {
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: offset,
                },
            },
        ],
        placement: placement,
    }), attributes = _f.attributes, styles = _f.styles;
    if (!visible)
        return null;
    return (<div className='str-chat__tooltip' ref={setPopperElement} style={styles.popper} {...attributes.popper}>
      {children}
    </div>);
};
exports.PopperTooltip = PopperTooltip;
