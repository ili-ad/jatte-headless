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
exports.StopAIGenerationButton = void 0;
var react_1 = require("react");
var icons_1 = require("./icons");
/**
 * Placeholder implementation of the StopAIGenerationButton component.
 */
var StopAIGenerationButton = function (_a) {
    var children = _a.children, rest = __rest(_a, ["children"]);
    return (<button aria-label='Stop AI generation' className='str-chat__stop-ai-generation-button' data-testid='stop-ai-generation-button' type='button' {...rest}>
    {children || <icons_1.CloseIcon />}
  </button>);
};
exports.StopAIGenerationButton = StopAIGenerationButton;
exports.default = exports.StopAIGenerationButton;
