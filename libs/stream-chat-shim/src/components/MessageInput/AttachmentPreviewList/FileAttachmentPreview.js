"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAttachmentPreview = void 0;
var react_1 = require("react");
var context_1 = require("../../../context");
var ReactFileUtilities_1 = require("../../ReactFileUtilities");
var icons_1 = require("../icons");
var FileAttachmentPreview = function (_a) {
    var _b;
    var attachment = _a.attachment, handleRetry = _a.handleRetry, removeAttachments = _a.removeAttachments;
    var t = (0, context_1.useTranslationContext)('FilePreview').t;
    var uploadState = (_b = attachment.localMetadata) === null || _b === void 0 ? void 0 : _b.uploadState;
    return (<div className='str-chat__attachment-preview-file' data-testid='attachment-preview-file'>
      <div className='str-chat__attachment-preview-file-icon'>
        <ReactFileUtilities_1.FileIcon filename={attachment.title} mimeType={attachment.mime_type}/>
      </div>

      <button aria-label={t('aria/Remove attachment')} className='str-chat__attachment-preview-delete' data-testid='file-preview-item-delete-button' disabled={uploadState === 'uploading'} onClick={function () {
            var _a, _b;
            return ((_a = attachment.localMetadata) === null || _a === void 0 ? void 0 : _a.id) &&
                removeAttachments([(_b = attachment.localMetadata) === null || _b === void 0 ? void 0 : _b.id]);
        }}>
        <icons_1.CloseIcon />
      </button>

      {['blocked', 'failed'].includes(uploadState) && !!handleRetry && (<button className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file' data-testid='file-preview-item-retry-button' onClick={function () {
                handleRetry(attachment);
            }}>
          <icons_1.RetryIcon />
        </button>)}

      <div className='str-chat__attachment-preview-file-end'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {attachment.title}
        </div>
        {/* undefined if loaded from a draft */}
        {(typeof uploadState === 'undefined' || uploadState === 'finished') &&
            !!attachment.asset_url && (<a aria-label={t('aria/Download attachment')} className='str-chat__attachment-preview-file-download' download href={attachment.asset_url} rel='noreferrer' target='_blank' title={t('Download attachment {{ name }}', { name: attachment.title })}>
              <icons_1.DownloadIcon />
            </a>)}
        {uploadState === 'uploading' && <icons_1.LoadingIndicatorIcon size={17}/>}
      </div>
    </div>);
};
exports.FileAttachmentPreview = FileAttachmentPreview;
