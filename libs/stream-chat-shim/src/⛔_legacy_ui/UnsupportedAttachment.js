"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedAttachment = void 0;
var react_1 = require("react");
var UnsupportedAttachment = function (_a) {
    var _b;
    var attachment = _a.attachment;
    return (<div data-testid="unsupported-attachment">{(_b = attachment.title) !== null && _b !== void 0 ? _b : 'Unsupported attachment'}</div>);
};
exports.UnsupportedAttachment = UnsupportedAttachment;
