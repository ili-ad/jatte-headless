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
exports.DialogMenuButton = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var DialogMenuButton = function (_a) {
    var children = _a.children, className = _a.className, props = __rest(_a, ["children", "className"]);
    return (<button className={(0, clsx_1.default)('str-chat__dialog-menu__button', className)} {...props}>
    <div className='str-chat__dialog-menu__button-icon'/>
    <div className='str-chat__dialog-menu__button-text'>{children}</div>
  </button>);
};
exports.DialogMenuButton = DialogMenuButton;
