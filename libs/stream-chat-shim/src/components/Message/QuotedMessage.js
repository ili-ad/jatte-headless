"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotedMessage = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var Attachment_1 = require("../Attachment");
var Avatar_1 = require("../Avatar");
var Poll_1 = require("../Poll");
var ChatContext_1 = require("../../context/ChatContext");
var ComponentContext_1 = require("../../context/ComponentContext");
var MessageContext_1 = require("../../context/MessageContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var ChannelActionContext_1 = require("../../context/ChannelActionContext");
var renderText_1 = require("./renderText");
var QuotedMessage = function (_a) {
    var _b, _c, _d, _e;
    var propsRenderText = _a.renderText;
    var _f = (0, ComponentContext_1.useComponentContext)('QuotedMessage'), _g = _f.Attachment, Attachment = _g === void 0 ? Attachment_1.Attachment : _g, ContextAvatar = _f.Avatar;
    var client = (0, ChatContext_1.useChatContext)().client;
    var _h = (0, MessageContext_1.useMessageContext)('QuotedMessage'), isMyMessage = _h.isMyMessage, message = _h.message, contextRenderText = _h.renderText;
    var _j = (0, TranslationContext_1.useTranslationContext)('QuotedMessage'), t = _j.t, userLanguage = _j.userLanguage;
    var jumpToMessage = (0, ChannelActionContext_1.useChannelActionContext)('QuotedMessage').jumpToMessage;
    var renderText = (_b = propsRenderText !== null && propsRenderText !== void 0 ? propsRenderText : contextRenderText) !== null && _b !== void 0 ? _b : renderText_1.renderText;
    var Avatar = ContextAvatar || Avatar_1.Avatar;
    var quoted_message = message.quoted_message;
    var poll = (quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.poll_id) &&
    ;
    var quotedMessageDeleted = (quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.deleted_at) || (quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.type) === 'deleted';
    var quotedMessageText = quotedMessageDeleted
        ? t('This message was deleted...')
        : ((_c = quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.i18n) === null || _c === void 0 ? void 0 : _c["".concat(userLanguage, "_text")]) ||
            (quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.text);
    var quotedMessageAttachment = ((_d = quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.attachments) === null || _d === void 0 ? void 0 : _d.length) && !quotedMessageDeleted
        ? quoted_message.attachments[0]
        : null;
    var renderedText = (0, react_1.useMemo)(function () { return renderText(quotedMessageText, quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.mentioned_users); }, [quotedMessageText, quoted_message === null || quoted_message === void 0 ? void 0 : quoted_message.mentioned_users, renderText]);
    if (!quoted_message)
        return null;
    if (!quoted_message.poll && !quotedMessageText && !quotedMessageAttachment)
        return null;
    return (<>
      <div className={(0, clsx_1.default)('str-chat__quoted-message-preview', { mine: isMyMessage })} data-testid='quoted-message' onClickCapture={function (e) {
            e.stopPropagation();
            e.preventDefault();
            jumpToMessage(quoted_message.id);
        }}>
        {quoted_message.user && (<Avatar className='str-chat__avatar--quoted-message-sender' image={quoted_message.user.image} name={quoted_message.user.name || quoted_message.user.id} user={quoted_message.user}/>)}
        <div className='str-chat__quoted-message-bubble' data-testid='quoted-message-contents'>
          {poll ? (<Poll_1.Poll isQuoted poll={poll}/>) : (<>
              {quotedMessageAttachment && (<Attachment attachments={[quotedMessageAttachment]} isQuoted/>)}
              <div className='str-chat__quoted-message-bubble__text' data-testid='quoted-message-text'>
                {renderedText}
              </div>
            </>)}
        </div>
      </div>
      {((_e = message.attachments) === null || _e === void 0 ? void 0 : _e.length) ? (<Attachment attachments={message.attachments}/>) : null}
    </>);
};
exports.QuotedMessage = QuotedMessage;
