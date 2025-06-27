"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedAttachmentPreview = void 0;
var react_1 = require("react");
var stream_chat_1 = require("stream-chat");
var icons_1 = require("../icons");
var ReactFileUtilities_1 = require("../../ReactFileUtilities");
var context_1 = require("../../../context");
var UnsupportedAttachmentPreview = function (_a) {
    var _b, _c, _d, _e, _f;
    var attachment = _a.attachment, handleRetry = _a.handleRetry, removeAttachments = _a.removeAttachments;
    var t = (0, context_1.useTranslationContext)('UnsupportedAttachmentPreview').t;
    var title = (_b = attachment.title) !== null && _b !== void 0 ? _b : t('Unsupported attachment');
    return (<div className='str-chat__attachment-preview-unsupported' data-testid='attachment-preview-unknown'>
      <div className='str-chat__attachment-preview-file-icon'>
        <ReactFileUtilities_1.FileIcon filename={title} mimeType={attachment.mime_type}/>
      </div>

      <button aria-label={t('aria/Remove attachment')} className='str-chat__attachment-preview-delete' data-testid='file-preview-item-delete-button' disabled={((_c = attachment.localMetadata) === null || _c === void 0 ? void 0 : _c.uploadState) === 'uploading'} onClick={function () {
            var _a, _b;
            return ((_a = attachment.localMetadata) === null || _a === void 0 ? void 0 : _a.id) &&
                removeAttachments([(_b = attachment.localMetadata) === null || _b === void 0 ? void 0 : _b.id]);
        }}>
        <icons_1.CloseIcon />
      </button>

      {(0, stream_chat_1.isLocalUploadAttachment)(attachment) &&
            ['blocked', 'failed'].includes((_d = attachment.localMetadata) === null || _d === void 0 ? void 0 : _d.uploadState) &&
            !!handleRetry && (<button className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file' data-testid='file-preview-item-retry-button' onClick={function () { return handleRetry(attachment); }}>
            <icons_1.RetryIcon />
          </button>)}

      <div className='str-chat__attachment-preview-metadata'>
        <div className='str-chat__attachment-preview-title' title={title}>
          {title}
        </div>
        {((_e = attachment.localMetadata) === null || _e === void 0 ? void 0 : _e.uploadState) === 'finished' &&
            !!attachment.asset_url && (<a className='str-chat__attachment-preview-file-download' download href={attachment.asset_url} rel='noreferrer' target='_blank'>
              <icons_1.DownloadIcon />
            </a>)}
        {((_f = attachment.localMetadata) === null || _f === void 0 ? void 0 : _f.uploadState) === 'uploading' && (<icons_1.LoadingIndicatorIcon size={17}/>)}
      </div>
    </div>);
};
exports.UnsupportedAttachmentPreview = UnsupportedAttachmentPreview;
