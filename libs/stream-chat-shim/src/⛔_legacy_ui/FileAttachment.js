"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachment = void 0;
var react_1 = require("react");
/**
 * Placeholder FileAttachment component used in place of Stream Chat's
 * implementation. It simply renders the attachment title or name.
 */
var FileAttachment = function (_a) {
    var _b, _c;
    var attachment = _a.attachment;
    return (<div data-testid="file-attachment-placeholder">
    {(_c = (_b = attachment === null || attachment === void 0 ? void 0 : attachment.title) !== null && _b !== void 0 ? _b : attachment === null || attachment === void 0 ? void 0 : attachment.name) !== null && _c !== void 0 ? _c : 'File'}
  </div>);
};
exports.FileAttachment = FileAttachment;
