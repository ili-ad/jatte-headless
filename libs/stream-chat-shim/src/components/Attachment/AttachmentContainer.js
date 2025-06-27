"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedAttachmentContainer = exports.MediaContainer = exports.VoiceRecordingContainer = exports.AudioContainer = exports.FileContainer = exports.CardContainer = exports.ImageContainer = exports.GalleryContainer = exports.AttachmentActionsContainer = exports.AttachmentWithinContainer = void 0;
var react_1 = require("react");
var react_player_1 = require("react-player");
var clsx_1 = require("clsx");
var linkify = require("linkifyjs");
var AttachmentActions_1 = require("./AttachmentActions");
var Audio_1 = require("./Audio");
var VoiceRecording_1 = require("./VoiceRecording");
var Gallery_1 = require("../Gallery");
var Card_1 = require("./Card");
var FileAttachment_1 = require("./FileAttachment");
var UnsupportedAttachment_1 = require("./UnsupportedAttachment");
var utils_1 = require("./utils");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
var AttachmentWithinContainer = function (_a) {
    var _b;
    var _c;
    var attachment = _a.attachment, children = _a.children, componentType = _a.componentType;
    var isGAT = (0, utils_1.isGalleryAttachmentType)(attachment);
    var extra = '';
    if (!isGAT) {
        extra =
            componentType === 'card' && !(attachment === null || attachment === void 0 ? void 0 : attachment.image_url) && !(attachment === null || attachment === void 0 ? void 0 : attachment.thumb_url)
                ? 'no-image'
                : ((_c = attachment === null || attachment === void 0 ? void 0 : attachment.actions) === null || _c === void 0 ? void 0 : _c.length)
                    ? 'actions'
                    : '';
    }
    var classNames = (0, clsx_1.default)('str-chat__message-attachment str-chat__message-attachment-dynamic-size', (_b = {},
        _b["str-chat__message-attachment--".concat(componentType)] = componentType,
        _b["str-chat__message-attachment--".concat(attachment === null || attachment === void 0 ? void 0 : attachment.type)] = attachment === null || attachment === void 0 ? void 0 : attachment.type,
        _b["str-chat__message-attachment--".concat(componentType, "--").concat(extra)] = componentType && extra,
        _b['str-chat__message-attachment--svg-image'] = (0, utils_1.isSvgAttachment)(attachment),
        _b['str-chat__message-attachment-with-actions'] = extra === 'actions',
        _b));
    return <div className={classNames}>{children}</div>;
};
exports.AttachmentWithinContainer = AttachmentWithinContainer;
var AttachmentActionsContainer = function (_a) {
    var _b, _c;
    var actionHandler = _a.actionHandler, attachment = _a.attachment, _d = _a.AttachmentActions, AttachmentActions = _d === void 0 ? AttachmentActions_1.AttachmentActions : _d;
    if (!((_b = attachment.actions) === null || _b === void 0 ? void 0 : _b.length))
        return null;
    return (<AttachmentActions {...attachment} actionHandler={actionHandler} actions={attachment.actions} id={((_c = attachment.localMetadata) === null || _c === void 0 ? void 0 : _c.id) || ''} text={attachment.text || ''}/>);
};
exports.AttachmentActionsContainer = AttachmentActionsContainer;
function getCssDimensionsVariables(url) {
    var cssVars = {
        '--original-height': 1000000,
        '--original-width': 1000000,
    };
    if (linkify.test(url, 'url')) {
        var urlParams = new URL(url).searchParams;
        var oh = Number(urlParams.get('oh'));
        var ow = Number(urlParams.get('ow'));
        var originalHeight = oh > 1 ? oh : 1000000;
        var originalWidth = ow > 1 ? ow : 1000000;
        cssVars['--original-width'] = originalWidth;
        cssVars['--original-height'] = originalHeight;
    }
    return cssVars;
}
var GalleryContainer = function (_a) {
    var attachment = _a.attachment, _b = _a.Gallery, Gallery = _b === void 0 ? Gallery_1.Gallery : _b;
    var imageElements = (0, react_1.useRef)([]);
    var imageAttachmentSizeHandler = (0, ChannelStateContext_1.useChannelStateContext)().imageAttachmentSizeHandler;
    var _c = (0, react_1.useState)([]), attachmentConfigurations = _c[0], setAttachmentConfigurations = _c[1];
    (0, react_1.useLayoutEffect)(function () {
        if (imageElements.current &&
            imageElements.current.every(function (element) { return !!element; }) &&
            imageAttachmentSizeHandler) {
            var newConfigurations_1 = [];
            imageElements.current.forEach(function (element, i) {
                var config = imageAttachmentSizeHandler(attachment.images[i], element);
                newConfigurations_1.push(config);
            });
            setAttachmentConfigurations(newConfigurations_1);
        }
    }, [imageElements, imageAttachmentSizeHandler, attachment]);
    var images = attachment.images.map(function (image, i) {
        var _a, _b, _c;
        return (__assign(__assign({}, image), { previewUrl: ((_a = attachmentConfigurations[i]) === null || _a === void 0 ? void 0 : _a.url) || 'about:blank', style: getCssDimensionsVariables(((_b = attachment.images[i]) === null || _b === void 0 ? void 0 : _b.image_url) || ((_c = attachment.images[i]) === null || _c === void 0 ? void 0 : _c.thumb_url) || '') }));
    });
    return (<exports.AttachmentWithinContainer attachment={attachment} componentType='gallery'>
      <Gallery images={images || []} innerRefs={imageElements} key='gallery'/>
    </exports.AttachmentWithinContainer>);
};
exports.GalleryContainer = GalleryContainer;
var ImageContainer = function (props) {
    var attachment = props.attachment, _a = props.Image, Image = _a === void 0 ? Gallery_1.ImageComponent : _a;
    var componentType = 'image';
    var imageElement = (0, react_1.useRef)(null);
    var imageAttachmentSizeHandler = (0, ChannelStateContext_1.useChannelStateContext)().imageAttachmentSizeHandler;
    var _b = (0, react_1.useState)(undefined), attachmentConfiguration = _b[0], setAttachmentConfiguration = _b[1];
    (0, react_1.useLayoutEffect)(function () {
        if (imageElement.current && imageAttachmentSizeHandler) {
            var config = imageAttachmentSizeHandler(attachment, imageElement.current);
            setAttachmentConfiguration(config);
        }
    }, [imageElement, imageAttachmentSizeHandler, attachment]);
    var imageConfig = __assign(__assign({}, attachment), { previewUrl: (attachmentConfiguration === null || attachmentConfiguration === void 0 ? void 0 : attachmentConfiguration.url) || 'about:blank', style: getCssDimensionsVariables(attachment.image_url || attachment.thumb_url || '') });
    if (attachment.actions && attachment.actions.length) {
        return (<exports.AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <Image {...imageConfig} innerRef={imageElement}/>
          <exports.AttachmentActionsContainer {...props}/>
        </div>
      </exports.AttachmentWithinContainer>);
    }
    return (<exports.AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Image {...imageConfig} innerRef={imageElement}/>
    </exports.AttachmentWithinContainer>);
};
exports.ImageContainer = ImageContainer;
var CardContainer = function (props) {
    var attachment = props.attachment, _a = props.Card, Card = _a === void 0 ? Card_1.Card : _a;
    var componentType = 'card';
    if (attachment.actions && attachment.actions.length) {
        return (<exports.AttachmentWithinContainer attachment={attachment} componentType={componentType}>
        <div className='str-chat__attachment'>
          <Card {...attachment}/>
          <exports.AttachmentActionsContainer {...props}/>
        </div>
      </exports.AttachmentWithinContainer>);
    }
    return (<exports.AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <Card {...attachment}/>
    </exports.AttachmentWithinContainer>);
};
exports.CardContainer = CardContainer;
var FileContainer = function (_a) {
    var attachment = _a.attachment, _b = _a.File, File = _b === void 0 ? FileAttachment_1.FileAttachment : _b;
    if (!attachment.asset_url)
        return null;
    return (<exports.AttachmentWithinContainer attachment={attachment} componentType='file'>
      <File attachment={attachment}/>
    </exports.AttachmentWithinContainer>);
};
exports.FileContainer = FileContainer;
var AudioContainer = function (_a) {
    var attachment = _a.attachment, _b = _a.Audio, Audio = _b === void 0 ? Audio_1.Audio : _b;
    return (<exports.AttachmentWithinContainer attachment={attachment} componentType='audio'>
    <div className='str-chat__attachment'>
      <Audio og={attachment}/>
    </div>
  </exports.AttachmentWithinContainer>);
};
exports.AudioContainer = AudioContainer;
var VoiceRecordingContainer = function (_a) {
    var attachment = _a.attachment, isQuoted = _a.isQuoted, _b = _a.VoiceRecording, VoiceRecording = _b === void 0 ? VoiceRecording_1.VoiceRecording : _b;
    return (<exports.AttachmentWithinContainer attachment={attachment} componentType='voiceRecording'>
    <div className='str-chat__attachment'>
      <VoiceRecording attachment={attachment} isQuoted={isQuoted}/>
    </div>
  </exports.AttachmentWithinContainer>);
};
exports.VoiceRecordingContainer = VoiceRecordingContainer;
var MediaContainer = function (props) {
    var _a;
    var attachment = props.attachment, _b = props.Media, Media = _b === void 0 ? react_player_1.default : _b;
    var componentType = 'media';
    var _c = (0, ChannelStateContext_1.useChannelStateContext)(), shouldGenerateVideoThumbnail = _c.shouldGenerateVideoThumbnail, videoAttachmentSizeHandler = _c.videoAttachmentSizeHandler;
    var videoElement = (0, react_1.useRef)(null);
    var _d = (0, react_1.useState)(), attachmentConfiguration = _d[0], setAttachmentConfiguration = _d[1];
    (0, react_1.useLayoutEffect)(function () {
        if (videoElement.current && videoAttachmentSizeHandler) {
            var config = videoAttachmentSizeHandler(attachment, videoElement.current, shouldGenerateVideoThumbnail);
            setAttachmentConfiguration(config);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoElement, videoAttachmentSizeHandler, attachment]);
    var content = (<div className='str-chat__player-wrapper' data-testid='video-wrapper' ref={videoElement} style={getCssDimensionsVariables(attachment.thumb_url || '')}>
      <Media className='react-player' config={{ file: { attributes: { poster: attachmentConfiguration === null || attachmentConfiguration === void 0 ? void 0 : attachmentConfiguration.thumbUrl } } }} controls height='100%' url={attachmentConfiguration === null || attachmentConfiguration === void 0 ? void 0 : attachmentConfiguration.url} width='100%'/>
    </div>);
    return ((_a = attachment.actions) === null || _a === void 0 ? void 0 : _a.length) ? (<exports.AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      <div className='str-chat__attachment'>
        {content}
        <exports.AttachmentActionsContainer {...props}/>
      </div>
    </exports.AttachmentWithinContainer>) : (<exports.AttachmentWithinContainer attachment={attachment} componentType={componentType}>
      {content}
    </exports.AttachmentWithinContainer>);
};
exports.MediaContainer = MediaContainer;
var UnsupportedAttachmentContainer = function (_a) {
    var attachment = _a.attachment, _b = _a.UnsupportedAttachment, UnsupportedAttachment = _b === void 0 ? UnsupportedAttachment_1.UnsupportedAttachment : _b;
    return (<>
    <UnsupportedAttachment attachment={attachment}/>
  </>);
};
exports.UnsupportedAttachmentContainer = UnsupportedAttachmentContainer;
