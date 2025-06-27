"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadHeader = void 0;
var react_1 = require("react");
var useChannelPreviewInfo_1 = require("../ChannelPreview/hooks/useChannelPreviewInfo");
var icons_1 = require("./icons");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var ThreadHeader = function (props) {
    var closeThread = props.closeThread, overrideImage = props.overrideImage, overrideTitle = props.overrideTitle;
    var t = (0, TranslationContext_1.useTranslationContext)('ThreadHeader').t;
    var channel = (0, ChannelStateContext_1.useChannelStateContext)('').channel;
    var displayTitle = (0, useChannelPreviewInfo_1.useChannelPreviewInfo)({
        channel: channel,
        overrideImage: overrideImage,
        overrideTitle: overrideTitle,
    }).displayTitle;
    return (<div className='str-chat__thread-header'>
      <div className='str-chat__thread-header-details'>
        <div className='str-chat__thread-header-title'>{t('Thread')}</div>
        <div className='str-chat__thread-header-subtitle'>{displayTitle}</div>
      </div>
      <button aria-label={t('aria/Close thread')} className='str-chat__close-thread-button' data-testid='close-button' onClick={closeThread}>
        <icons_1.CloseIcon />
      </button>
    </div>);
};
exports.ThreadHeader = ThreadHeader;
