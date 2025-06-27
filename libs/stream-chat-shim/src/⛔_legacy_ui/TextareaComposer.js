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
exports.TextareaComposer = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `TextareaComposer` component.
 */
exports.TextareaComposer = (0, react_1.forwardRef)(function (_a, ref) {
    var _b;
    var textComposer = _a.textComposer, onChange = _a.onChange, value = _a.value, rest = __rest(_a, ["textComposer", "onChange", "value"]);
    var handleChange = function (e) {
        var _a;
        (_a = textComposer === null || textComposer === void 0 ? void 0 : textComposer.setText) === null || _a === void 0 ? void 0 : _a.call(textComposer, e.target.value);
        onChange === null || onChange === void 0 ? void 0 : onChange(e);
    };
    return (<textarea data-testid="textarea-composer" ref={ref} value={(_b = textComposer === null || textComposer === void 0 ? void 0 : textComposer.state.text) !== null && _b !== void 0 ? _b : value} onChange={handleChange} {...rest}/>);
});
exports.default = exports.TextareaComposer;
