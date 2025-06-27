"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageErrorText = MessageErrorText;
var react_1 = require("react");
var utils_1 = require("./utils");
var context_1 = require("../../context");
function MessageErrorText(_a) {
    var _b;
    var message = _a.message, theme = _a.theme;
    var t = (0, context_1.useTranslationContext)('MessageText').t;
    if (message.type === 'error' && !(0, utils_1.isMessageBounced)(message)) {
        return (<div className={"str-chat__".concat(theme, "-message--error-message str-chat__message--error-message")}>
        {t('Error · Unsent')}
      </div>);
    }
    if (message.status === 'failed') {
        return (<div className={"str-chat__".concat(theme, "-message--error-message str-chat__message--error-message")}>
        {((_b = message.error) === null || _b === void 0 ? void 0 : _b.status) !== 403
                ? t('Message Failed · Click to try again')
                : t('Message Failed · Unauthorized')}
      </div>);
    }
    return null;
}
