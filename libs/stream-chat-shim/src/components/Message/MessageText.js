"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageText = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var QuotedMessage_1 = require("./QuotedMessage");
var utils_1 = require("./utils");
var context_1 = require("../../context");
var renderText_1 = require("./renderText");
var MessageErrorText_1 = require("./MessageErrorText");
var UnMemoizedMessageTextComponent = function (props) {
    var _a;
    var _b, _c;
    var customInnerClass = props.customInnerClass, _d = props.customWrapperClass, customWrapperClass = _d === void 0 ? '' : _d, propMessage = props.message, propsRenderText = props.renderText, _e = props.theme, theme = _e === void 0 ? 'simple' : _e;
    var _f = (0, context_1.useComponentContext)('MessageText').QuotedMessage, QuotedMessage = _f === void 0 ? QuotedMessage_1.QuotedMessage : _f;
    var _g = (0, context_1.useMessageContext)('MessageText'), contextMessage = _g.message, onMentionsClickMessage = _g.onMentionsClickMessage, onMentionsHoverMessage = _g.onMentionsHoverMessage, contextRenderText = _g.renderText, unsafeHTML = _g.unsafeHTML;
    var renderText = (_b = propsRenderText !== null && propsRenderText !== void 0 ? propsRenderText : contextRenderText) !== null && _b !== void 0 ? _b : renderText_1.renderText;
    var userLanguage = (0, context_1.useTranslationContext)('MessageText').userLanguage;
    var message = propMessage || contextMessage;
    var hasAttachment = (0, utils_1.messageHasAttachments)(message);
    var messageTextToRender = ((_c = message.i18n) === null || _c === void 0 ? void 0 : _c["".concat(userLanguage, "_text")]) ||
        message.text;
    var messageText = (0, react_1.useMemo)(function () { return renderText(messageTextToRender, message.mentioned_users); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message.mentioned_users, messageTextToRender]);
    var wrapperClass = customWrapperClass || 'str-chat__message-text';
    var innerClass = customInnerClass ||
        "str-chat__message-text-inner str-chat__message-".concat(theme, "-text-inner");
    if (!messageTextToRender && !message.quoted_message)
        return null;
    return (<div className={wrapperClass} tabIndex={0}>
      <div className={(0, clsx_1.default)(innerClass, (_a = {},
            _a["str-chat__message-".concat(theme, "-text-inner--has-attachment")] = hasAttachment,
            _a[" str-chat__message-".concat(theme, "-text-inner--is-emoji")] = (0, utils_1.isOnlyEmojis)(message.text) && !message.quoted_message,
            _a))} data-testid='message-text-inner-wrapper' onClick={onMentionsClickMessage} onMouseOver={onMentionsHoverMessage}>
        {message.quoted_message && <QuotedMessage />}
        <MessageErrorText_1.MessageErrorText message={message} theme={theme}/>
        {unsafeHTML && message.html ? (<div dangerouslySetInnerHTML={{ __html: message.html }}/>) : (<div>{messageText}</div>)}
      </div>
    </div>);
};
exports.MessageText = react_1.default.memo(UnMemoizedMessageTextComponent);
