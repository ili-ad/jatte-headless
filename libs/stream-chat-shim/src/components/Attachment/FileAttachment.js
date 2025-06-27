"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachment = void 0;
var react_1 = require("react");
var FileIcon = (function () { return null; }); // temporary shim
var DownloadButton = function (_) { return null; }; // temporary shim
var FileSizeIndicator = function (_) { return null; }; // temporary shim
var UnMemoizedFileAttachment = function (_a) {
    var attachment = _a.attachment;
    return (<div className='str-chat__message-attachment-file--item' data-testid='attachment-file'>
    <FileIcon className='str-chat__file-icon' mimeType={attachment.mime_type}/>
    <div className='str-chat__message-attachment-file--item-text'>
      <div className='str-chat__message-attachment-file--item-first-row'>
        <div className='str-chat__message-attachment-file--item-name' data-testid='file-title'>
          {attachment.title}
        </div>
        <DownloadButton assetUrl={attachment.asset_url}/>
      </div>
      <FileSizeIndicator fileSize={attachment.file_size}/>
    </div>
  </div>);
};
exports.FileAttachment = react_1.default.memo(UnMemoizedFileAttachment);
