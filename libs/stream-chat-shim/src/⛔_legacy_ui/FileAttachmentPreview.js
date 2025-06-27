"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachmentPreview = void 0;
var react_1 = require("react");
/**
 * Placeholder FileAttachmentPreview component used while porting the real
 * implementation from `stream-chat-react`.
 */
var FileAttachmentPreview = function (props) {
    var _a;
    var attachment = props.attachment;
    return (<div data-testid="file-attachment-preview-placeholder">
      {(_a = attachment === null || attachment === void 0 ? void 0 : attachment.title) !== null && _a !== void 0 ? _a : 'File Attachment'}
    </div>);
};
exports.FileAttachmentPreview = FileAttachmentPreview;
exports.default = exports.FileAttachmentPreview;
