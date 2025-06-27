"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotedMessagePreview = exports.QuotedMessagePreviewHeader = void 0;
var react_1 = require("react");
var Attachment_1 = require("../Attachment");
var Avatar_1 = require("../Avatar");
var icons_1 = require("./icons");
var ChannelActionContext_1 = require("../../context/ChannelActionContext");
var ComponentContext_1 = require("../../context/ComponentContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var QuotedMessagePreviewHeader = function () {
    var setQuotedMessage = (0, ChannelActionContext_1.useChannelActionContext)('QuotedMessagePreview').setQuotedMessage;
    var t = (0, TranslationContext_1.useTranslationContext)('QuotedMessagePreview').t;
    return (<div className='str-chat__quoted-message-preview-header'>
      <div className='str-chat__quoted-message-reply-to-message'>
        {t('Reply to Message')}
      </div>
      <button aria-label={t('aria/Cancel Reply')} className='str-chat__quoted-message-remove' onClick={function () { return setQuotedMessage(undefined); }}>
        <icons_1.CloseIcon />
      </button>
    </div>);
};
exports.QuotedMessagePreviewHeader = QuotedMessagePreviewHeader;
var QuotedMessagePreview = function (_a) {
    var _b;
    var quotedMessage = _a.quotedMessage;
    var _c = (0, ComponentContext_1.useComponentContext)('QuotedMessagePreview'), _d = _c.Attachment, Attachment = _d === void 0 ? Attachment_1.Attachment : _d, _e = _c.Avatar, Avatar = _e === void 0 ? Avatar_1.Avatar : _e;
    var userLanguage = (0, TranslationContext_1.useTranslationContext)('QuotedMessagePreview').userLanguage;
    var quotedMessageText = ((_b = quotedMessage.i18n) === null || _b === void 0 ? void 0 : _b["".concat(userLanguage, "_text")]) ||
        quotedMessage.text;
    var quotedMessageAttachment = (0, react_1.useMemo)(function () {
        var _a;
        var attachment = ((_a = quotedMessage.attachments) !== null && _a !== void 0 ? _a : [])[0];
        return attachment ? [attachment] : [];
    }, [quotedMessage.attachments]);
    if (!quotedMessageText && !quotedMessageAttachment)
        return null;
    return (<div className='str-chat__quoted-message-preview' data-testid='quoted-message-preview'>
      {quotedMessage.user && (<Avatar className='str-chat__avatar--quoted-message-sender' image={quotedMessage.user.image} name={quotedMessage.user.name || quotedMessage.user.id} user={quotedMessage.user}/>)}
      <div className='str-chat__quoted-message-bubble'>
        {!!quotedMessageAttachment.length && (<Attachment attachments={quotedMessageAttachment} isQuoted/>)}
        <div className='str-chat__quoted-message-text' data-testid='quoted-message-text'>
          <p>{quotedMessageText}</p>
        </div>
      </div>
    </div>);
};
exports.QuotedMessagePreview = QuotedMessagePreview;
