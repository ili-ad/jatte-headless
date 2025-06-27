"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Window = void 0;
var react_1 = require("react");
var Window = function (props) {
    var children = props.children;
    return <div data-testid="window">{children}</div>;
};
exports.Window = Window;
exports.default = exports.Window;
