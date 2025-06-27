"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emoji = void 0;
var react_1 = require("react");
var Emoji = function (_a) {
    var children = _a.children;
    return (<span className='inline-text-emoji' data-testid='inline-text-emoji'>
    {children}
  </span>);
};
exports.Emoji = Emoji;
