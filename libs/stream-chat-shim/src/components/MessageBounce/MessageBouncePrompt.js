"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBouncePrompt = MessageBouncePrompt;
var react_1 = require("react");
var context_1 = require("../../context");
function MessageBouncePrompt(_a) {
    var children = _a.children, onClose = _a.onClose;
    var _b = (0, context_1.useMessageBounceContext)('MessageBouncePrompt'), handleDelete = _b.handleDelete, handleEdit = _b.handleEdit, handleRetry = _b.handleRetry;
    var t = (0, context_1.useTranslationContext)('MessageBouncePrompt').t;
    function createHandler(handle) {
        return function (e) {
            handle(e);
            onClose === null || onClose === void 0 ? void 0 : onClose(e);
        };
    }
    return (<div className='str-chat__message-bounce-prompt' data-testid='message-bounce-prompt'>
      <div className='str-chat__message-bounce-prompt-header'>
        {children !== null && children !== void 0 ? children : t('This message did not meet our content guidelines')}
      </div>
      <div className='str-chat__message-bounce-actions'>
        <button className='str-chat__message-bounce-edit' data-testid='message-bounce-edit' onClick={createHandler(handleEdit)} type='button'>
          {t('Edit Message')}
        </button>
        <button className='str-chat__message-bounce-send' data-testid='message-bounce-send' onClick={createHandler(handleRetry)}>
          {t('Send Anyway')}
        </button>
        <button className='str-chat__message-bounce-delete' data-testid='message-bounce-delete' onClick={createHandler(handleDelete)}>
          {t('Delete')}
        </button>
      </div>
    </div>);
}
