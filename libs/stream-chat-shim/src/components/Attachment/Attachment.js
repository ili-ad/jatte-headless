"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attachment = exports.ATTACHMENT_GROUPS_ORDER = void 0;
var react_1 = require("react");
// import {
//   isAudioAttachment,
//   isFileAttachment,
//   isImageAttachment,
//   isScrapedContent,
//   isVideoAttachment,
//   isVoiceRecordingAttachment,
var isAudioAttachment = (function () { return false; }); // temporary shim
var isFileAttachment = (function () { return false; }); // temporary shim
var isImageAttachment = (function () { return false; }); // temporary shim
var isScrapedContent = (function () { return false; }); // temporary shim
var isVideoAttachment = (function () { return false; }); // temporary shim
var isVoiceRecordingAttachment = (function () { return false; }); // temporary shim
var AttachmentContainer_1 = require("./AttachmentContainer");
var utils_1 = require("./utils");
var CONTAINER_MAP = {
    audio: AttachmentContainer_1.AudioContainer,
    card: AttachmentContainer_1.CardContainer,
    file: AttachmentContainer_1.FileContainer,
    media: AttachmentContainer_1.MediaContainer,
    unsupported: AttachmentContainer_1.UnsupportedAttachmentContainer,
    voiceRecording: AttachmentContainer_1.VoiceRecordingContainer,
};
exports.ATTACHMENT_GROUPS_ORDER = [
    'card',
    'gallery',
    'image',
    'media',
    'audio',
    'voiceRecording',
    'file',
    'unsupported',
];
/**
 * A component used for rendering message attachments. By default, the component supports: AttachmentActions, Audio, Card, File, Gallery, Image, and Video
 */
var Attachment = function (props) {
    var attachments = props.attachments;
    var groupedAttachments = (0, react_1.useMemo)(function () { return renderGroupedAttachments(props); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachments]);
    return (<div className='str-chat__attachment-list'>
      {exports.ATTACHMENT_GROUPS_ORDER.reduce(function (acc, groupName) { return __spreadArray(__spreadArray([], acc, true), groupedAttachments[groupName], true); }, [])}
    </div>);
};
exports.Attachment = Attachment;
var renderGroupedAttachments = function (_a) {
    var attachments = _a.attachments, rest = __rest(_a, ["attachments"]);
    var uploadedImages = attachments.filter(function (attachment) {
        return isImageAttachment(attachment);
    });
    var containers = attachments
        .filter(function (attachment) { return !isImageAttachment(attachment); })
        .reduce(function (typeMap, attachment) {
        var attachmentType = getAttachmentType(attachment);
        var Container = CONTAINER_MAP[attachmentType];
        typeMap[attachmentType].push(<Container key={"".concat(attachmentType, "-").concat(typeMap[attachmentType].length)} {...rest} attachment={attachment}/>);
        return typeMap;
    }, {
        audio: [],
        card: [],
        file: [],
        media: [],
        unsupported: [],
        // not used in reduce
        // eslint-disable-next-line sort-keys
        image: [],
        // eslint-disable-next-line sort-keys
        gallery: [],
        voiceRecording: [],
    });
    if (uploadedImages.length > 1) {
        containers['gallery'] = [
            <AttachmentContainer_1.GalleryContainer key='gallery-container' {...rest} attachment={{
                    images: uploadedImages,
                    type: 'gallery',
                }}/>,
        ];
    }
    else if (uploadedImages.length === 1) {
        containers['image'] = [
            <AttachmentContainer_1.ImageContainer key='image-container' {...rest} attachment={uploadedImages[0]}/>,
        ];
    }
    return containers;
};
var getAttachmentType = function (attachment) {
    if (isScrapedContent(attachment)) {
        return 'card';
    }
    else if (isVideoAttachment(attachment, utils_1.SUPPORTED_VIDEO_FORMATS)) {
        return 'media';
    }
    else if (isAudioAttachment(attachment)) {
        return 'audio';
    }
    else if (isVoiceRecordingAttachment(attachment)) {
        return 'voiceRecording';
    }
    else if (isFileAttachment(attachment, utils_1.SUPPORTED_VIDEO_FORMATS)) {
        return 'file';
    }
    return 'unsupported';
};
