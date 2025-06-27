"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRecordingPreview = void 0;
var react_1 = require("react");
var Attachment_1 = require("../../Attachment");
var MediaRecorder_1 = require("../../MediaRecorder");
var icons_1 = require("../icons");
var ReactFileUtilities_1 = require("../../ReactFileUtilities");
var useAudioController_1 = require("../../Attachment/hooks/useAudioController");
var context_1 = require("../../../context");
var VoiceRecordingPreview = function (_a) {
    var _b, _c, _d;
    var attachment = _a.attachment, handleRetry = _a.handleRetry, removeAttachments = _a.removeAttachments;
    var t = (0, context_1.useTranslationContext)().t;
    var _e = (0, useAudioController_1.useAudioController)({
        mimeType: attachment.mime_type,
    }), audioRef = _e.audioRef, isPlaying = _e.isPlaying, secondsElapsed = _e.secondsElapsed, togglePlay = _e.togglePlay;
    return (<div className='str-chat__attachment-preview-voice-recording' data-testid='attachment-preview-voice-recording'>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={attachment.asset_url} type={attachment.mime_type}/>
      </audio>
      <Attachment_1.PlayButton isPlaying={isPlaying} onClick={togglePlay}/>

      <button aria-label={t('aria/Remove attachment')} className='str-chat__attachment-preview-delete' data-testid='file-preview-item-delete-button' disabled={((_b = attachment.localMetadata) === null || _b === void 0 ? void 0 : _b.uploadState) === 'uploading'} onClick={function () { var _a; return ((_a = attachment.localMetadata) === null || _a === void 0 ? void 0 : _a.id) && removeAttachments([attachment.localMetadata.id]); }}>
        <icons_1.CloseIcon />
      </button>

      {['blocked', 'failed'].includes((_c = attachment.localMetadata) === null || _c === void 0 ? void 0 : _c.uploadState) &&
            !!handleRetry && (<button className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file' data-testid='file-preview-item-retry-button' onClick={function () { return handleRetry(attachment); }}>
            <icons_1.RetryIcon />
          </button>)}

      <div className='str-chat__attachment-preview-metadata'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {attachment.title}
        </div>
        {typeof attachment.duration !== 'undefined' && (<MediaRecorder_1.RecordingTimer durationSeconds={secondsElapsed || attachment.duration}/>)}
        {((_d = attachment.localMetadata) === null || _d === void 0 ? void 0 : _d.uploadState) === 'uploading' && (<icons_1.LoadingIndicatorIcon size={17}/>)}
      </div>
      <div className='str-chat__attachment-preview-file-icon'>
        <ReactFileUtilities_1.FileIcon filename={attachment.title} mimeType={attachment.mime_type}/>
      </div>
    </div>);
};
exports.VoiceRecordingPreview = VoiceRecordingPreview;
