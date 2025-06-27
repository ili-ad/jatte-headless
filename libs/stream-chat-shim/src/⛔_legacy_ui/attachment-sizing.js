"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoAttachmentConfiguration = exports.getImageAttachmentConfiguration = void 0;
// Simplified sizing helpers. Real logic from stream-chat-react is omitted.
// Returns a basic configuration object for image attachments.
var getImageAttachmentConfiguration = function (attachment, _element) {
    return {
        url: attachment.image_url || attachment.thumb_url || '',
    };
};
exports.getImageAttachmentConfiguration = getImageAttachmentConfiguration;
// Returns a basic configuration object for video attachments.
var getVideoAttachmentConfiguration = function (attachment, _element, _shouldGenerateVideoThumbnail) {
    return {
        thumbUrl: attachment.thumb_url,
        url: attachment.asset_url || '',
    };
};
exports.getVideoAttachmentConfiguration = getVideoAttachmentConfiguration;
