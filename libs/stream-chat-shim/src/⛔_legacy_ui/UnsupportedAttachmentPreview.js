"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedAttachmentPreview = void 0;
var react_1 = require("react");
/** Placeholder implementation of the UnsupportedAttachmentPreview component. */
var UnsupportedAttachmentPreview = function (_a) {
    var _b;
    var attachment = _a.attachment;
    return (<div className="str-chat__attachment-preview-unsupported" data-testid="attachment-preview-unsupported">
    {(_b = attachment.title) !== null && _b !== void 0 ? _b : 'Unsupported attachment'}
  </div>);
};
exports.UnsupportedAttachmentPreview = UnsupportedAttachmentPreview;
exports.default = exports.UnsupportedAttachmentPreview;
