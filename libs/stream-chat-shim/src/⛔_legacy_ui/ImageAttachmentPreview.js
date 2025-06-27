"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageAttachmentPreview = void 0;
var react_1 = require("react");
/**
 * Placeholder component for image attachments in the message input preview list.
 * TODO: replace with real implementation.
 */
var ImageAttachmentPreview = function (_a) {
    var attachment = _a.attachment;
    return (<div data-testid="image-attachment-preview-placeholder">
    {(attachment === null || attachment === void 0 ? void 0 : attachment.title) || (attachment === null || attachment === void 0 ? void 0 : attachment.name) || 'Image'}
  </div>);
};
exports.ImageAttachmentPreview = ImageAttachmentPreview;
exports.default = exports.ImageAttachmentPreview;
