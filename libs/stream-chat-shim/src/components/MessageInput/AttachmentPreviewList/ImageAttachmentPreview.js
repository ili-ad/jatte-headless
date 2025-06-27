"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageAttachmentPreview = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var CloseIcon = function () { return null; }; // temporary shim
var LoadingIndicatorIcon = function (_) { return null; }; // temporary shim
var RetryIcon = function () { return null; }; // temporary shim
var Gallery_1 = require("../../Gallery");
var context_1 = require("../../../context");
var ImageAttachmentPreview = function (_a) {
    var _b;
    var attachment = _a.attachment, handleRetry = _a.handleRetry, removeAttachments = _a.removeAttachments;
    var t = (0, context_1.useTranslationContext)('ImagePreviewItem').t;
    var _c = (0, context_1.useComponentContext)('ImagePreview').BaseImage, BaseImage = _c === void 0 ? Gallery_1.BaseImage : _c;
    var _d = (0, react_1.useState)(false), previewError = _d[0], setPreviewError = _d[1];
    var _e = (_b = attachment.localMetadata) !== null && _b !== void 0 ? _b : {}, id = _e.id, uploadState = _e.uploadState;
    var handleLoadError = (0, react_1.useCallback)(function () { return setPreviewError(true); }, []);
    var assetUrl = attachment.image_url || attachment.localMetadata.previewUri;
    return (<div className={(0, clsx_1.default)('str-chat__attachment-preview-image', {
            'str-chat__attachment-preview-image--error': previewError,
        })} data-testid='attachment-preview-image'>
      <button aria-label={t('aria/Remove attachment')} className='str-chat__attachment-preview-delete' data-testid='image-preview-item-delete-button' disabled={uploadState === 'uploading'} onClick={function () { return id && removeAttachments([id]); }}>
        <CloseIcon />
      </button>

      {['blocked', 'failed'].includes(uploadState) && (<button className='str-chat__attachment-preview-error str-chat__attachment-preview-error-image' data-testid='image-preview-item-retry-button' onClick={function () { return handleRetry(attachment); }}>
          <RetryIcon />
        </button>)}

      {uploadState === 'uploading' && (<div className='str-chat__attachment-preview-image-loading'>
          <LoadingIndicatorIcon size={17}/>
        </div>)}

      {assetUrl && (<BaseImage alt={attachment.fallback} className='str-chat__attachment-preview-thumbnail' onError={handleLoadError} src={assetUrl} title={attachment.fallback}/>)}
    </div>);
};
exports.ImageAttachmentPreview = ImageAttachmentPreview;
