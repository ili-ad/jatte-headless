"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDeleted = void 0;
var react_1 = require("react");
var useUserRole_1 = require("./hooks/useUserRole");
var TranslationContext_1 = require("../../context/TranslationContext");
var MessageDeleted = function (props) {
    var message = props.message;
    var t = (0, TranslationContext_1.useTranslationContext)('MessageDeleted').t;
    var isMyMessage = (0, useUserRole_1.useUserRole)(message).isMyMessage;
    var messageClasses = isMyMessage
        ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
        : 'str-chat__message str-chat__message-simple str-chat__message--other';
    return (<div className={"".concat(messageClasses, " str-chat__message--deleted ").concat(message.type, " ")} data-testid={'message-deleted-component'} key={message.id}>
      <div className='str-chat__message--deleted-inner'>
        {t('This message was deleted...')}
      </div>
    </div>);
};
exports.MessageDeleted = MessageDeleted;
