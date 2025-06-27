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
exports.PromptDialog = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var PromptDialog = function (_a) {
    var actions = _a.actions, className = _a.className, prompt = _a.prompt, title = _a.title;
    return (<div className={(0, clsx_1.default)('str-chat__dialog str-chat__dialog--prompt', className)}>
    <div className='str-chat__dialog__body'>
      {title && <div className='str-chat__dialog__title'>{title}</div>}
      <div className='str-chat__dialog__prompt'>{prompt}</div>
    </div>
    <div className='str-chat__dialog__controls'>
      {actions.map(function (_a, i) {
            var className = _a.className, props = __rest(_a, ["className"]);
            return (<button className={(0, clsx_1.default)("str-chat__dialog__controls-button", className)} key={"prompt-dialog__controls-button--".concat(i)} {...props}/>);
        })}
    </div>
  </div>);
};
exports.PromptDialog = PromptDialog;
