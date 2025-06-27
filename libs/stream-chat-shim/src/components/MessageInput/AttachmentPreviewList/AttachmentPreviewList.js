"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentPreviewList = void 0;
var react_1 = require("react");
// import {
//   isLocalAttachment,
//   isLocalAudioAttachment,
//   isLocalFileAttachment,
//   isLocalImageAttachment,
//   isLocalVideoAttachment,
//   isLocalVoiceRecordingAttachment,
//   isScrapedContent,
var chat_shim_1 = require("../../../../../chat-shim");
var UnsupportedAttachmentPreview_1 = require("./UnsupportedAttachmentPreview");
var VoiceRecordingPreview_1 = require("./VoiceRecordingPreview");
var FileAttachmentPreview_1 = require("./FileAttachmentPreview");
var ImageAttachmentPreview_1 = require("./ImageAttachmentPreview");
var useAttachmentManagerState = function () { return ({ attachments: [] }); };
var useMessageComposer = function () { return ({
    attachmentManager: {
        uploadAttachment: function (_a) { },
        removeAttachments: function (_ids) { },
    },
}); };
var AttachmentPreviewList = function (_b) {
    var _c = _b.AudioAttachmentPreview, AudioAttachmentPreview = _c === void 0 ? FileAttachmentPreview_1.FileAttachmentPreview : _c, _d = _b.FileAttachmentPreview, FileAttachmentPreview = _d === void 0 ? FileAttachmentPreview_1.FileAttachmentPreview : _d, _e = _b.ImageAttachmentPreview, ImageAttachmentPreview = _e === void 0 ? ImageAttachmentPreview_1.ImageAttachmentPreview : _e, _f = _b.UnsupportedAttachmentPreview, UnsupportedAttachmentPreview = _f === void 0 ? UnsupportedAttachmentPreview_1.UnsupportedAttachmentPreview : _f, _g = _b.VideoAttachmentPreview, VideoAttachmentPreview = _g === void 0 ? FileAttachmentPreview_1.FileAttachmentPreview : _g, _h = _b.VoiceRecordingPreview, VoiceRecordingPreview = _h === void 0 ? VoiceRecordingPreview_1.VoiceRecordingPreview : _h;
    var messageComposer = useMessageComposer();
    var attachments = useAttachmentManagerState().attachments;
    if (!attachments.length)
        return null;
    return (<div className='str-chat__attachment-preview-list'>
      <div className='str-chat__attachment-list-scroll-container' data-testid='attachment-list-scroll-container'>
        {attachments.map(function (attachment) {
            if ((0, chat_shim_1.isScrapedContent)(attachment))
                return null;
            if ((0, chat_shim_1.isLocalVoiceRecordingAttachment)(attachment)) {
                return (<VoiceRecordingPreview attachment={attachment} handleRetry={messageComposer.attachmentManager.uploadAttachment} key={attachment.localMetadata.id || attachment.asset_url} removeAttachments={messageComposer.attachmentManager.removeAttachments}/>);
            }
            else if ((0, chat_shim_1.isLocalAudioAttachment)(attachment)) {
                return (<AudioAttachmentPreview attachment={attachment} handleRetry={messageComposer.attachmentManager.uploadAttachment} key={attachment.localMetadata.id || attachment.asset_url} removeAttachments={messageComposer.attachmentManager.removeAttachments}/>);
            }
            else if ((0, chat_shim_1.isLocalVideoAttachment)(attachment)) {
                return (<VideoAttachmentPreview attachment={attachment} handleRetry={messageComposer.attachmentManager.uploadAttachment} key={attachment.localMetadata.id || attachment.asset_url} removeAttachments={messageComposer.attachmentManager.removeAttachments}/>);
            }
            else if ((0, chat_shim_1.isLocalImageAttachment)(attachment)) {
                return (<ImageAttachmentPreview attachment={attachment} handleRetry={messageComposer.attachmentManager.uploadAttachment} key={attachment.localMetadata.id || attachment.image_url} removeAttachments={messageComposer.attachmentManager.removeAttachments}/>);
            }
            else if ((0, chat_shim_1.isLocalFileAttachment)(attachment)) {
                return (<FileAttachmentPreview attachment={attachment} handleRetry={messageComposer.attachmentManager.uploadAttachment} key={attachment.localMetadata.id || attachment.asset_url} removeAttachments={messageComposer.attachmentManager.removeAttachments}/>);
            }
            else if ((0, chat_shim_1.isLocalAttachment)(attachment)) {
                return (<UnsupportedAttachmentPreview attachment={attachment} handleRetry={messageComposer.attachmentManager.uploadAttachment} key={attachment.localMetadata.id} removeAttachments={messageComposer.attachmentManager.removeAttachments}/>);
            }
            return null;
        })}
      </div>
    </div>);
};
exports.AttachmentPreviewList = AttachmentPreviewList;
