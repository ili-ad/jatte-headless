"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBlocked = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var useUserRole = function (_message) { return ({ isMyMessage: false }); };
var useTranslationContext = function (_) { return ({ t: function (key) { return key; } }); };
var useMessageContext = function () { return ({ message: { id: '', type: '' } }); };
var MessageBlocked = function () {
    var message = useMessageContext().message;
    var t = useTranslationContext('MessageBlocked').t;
    var isMyMessage = useUserRole(message).isMyMessage;
    var messageClasses = (0, clsx_1.default)('str-chat__message str-chat__message-simple str-chat__message--blocked', message.type, {
        'str-chat__message--me str-chat__message-simple--me': isMyMessage,
        'str-chat__message--other': !isMyMessage,
    });
    return (<div className={messageClasses} data-testid='message-blocked-component' key={message.id}>
      <div className='str-chat__message--blocked-inner'>
        {t('Message was blocked by moderation policies')}
      </div>
    </div>);
};
exports.MessageBlocked = MessageBlocked;
