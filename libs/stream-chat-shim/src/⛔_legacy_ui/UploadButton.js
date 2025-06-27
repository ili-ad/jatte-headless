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
exports.UploadButton = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream Chat's UploadButton component.
 * It forwards selected files via the onFileChange callback.
 */
var UploadButton = function (_a) {
    var onFileChange = _a.onFileChange, _b = _a.resetOnChange, resetOnChange = _b === void 0 ? true : _b, rest = __rest(_a, ["onFileChange", "resetOnChange"]);
    var handleChange = function (event) {
        var _a;
        var files = Array.from((_a = event.target.files) !== null && _a !== void 0 ? _a : []);
        onFileChange(files);
        if (resetOnChange) {
            event.target.value = '';
        }
    };
    return <input type="file" onChange={handleChange} {...rest}/>;
};
exports.UploadButton = UploadButton;
exports.default = exports.UploadButton;
