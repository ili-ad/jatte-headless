"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditMessageModal = exports.EditMessageForm = void 0;
var react_1 = require("react");
var MessageInput_1 = require("./MessageInput");
var MessageInputFlat_1 = require("./MessageInputFlat");
var Modal_1 = require("../Modal");
var context_1 = require("../../context");
var hooks_1 = require("./hooks");
var EditMessageFormSendButton = function () {
    var t = (0, context_1.useTranslationContext)().t;
    var hasSendableData = (0, hooks_1.useMessageComposerHasSendableData)();
    return (<button className='str-chat__edit-message-send' data-testid='send-button-edit-form' disabled={!hasSendableData} type='submit'>
      {t('Send')}
    </button>);
};
var EditMessageForm = function () {
    var t = (0, context_1.useTranslationContext)('EditMessageForm').t;
    var messageComposer = (0, hooks_1.useMessageComposer)();
    var _a = (0, context_1.useMessageInputContext)('EditMessageForm'), clearEditingState = _a.clearEditingState, handleSubmit = _a.handleSubmit;
    var cancel = (0, react_1.useCallback)(function () {
        clearEditingState === null || clearEditingState === void 0 ? void 0 : clearEditingState();
        messageComposer.restore();
    }, [clearEditingState, messageComposer]);
    (0, react_1.useEffect)(function () {
        var onKeyDown = function (event) {
            if (event.key === 'Escape')
                cancel();
        };
        document.addEventListener('keydown', onKeyDown);
        return function () { return document.removeEventListener('keydown', onKeyDown); };
    }, [cancel]);
    return (<form autoComplete='off' className='str-chat__edit-message-form' onSubmit={handleSubmit}>
      <MessageInputFlat_1.MessageInputFlat />
      <div className='str-chat__edit-message-form-options'>
        <button className='str-chat__edit-message-cancel' data-testid='cancel-button' onClick={cancel}>
          {t('Cancel')}
        </button>
        <EditMessageFormSendButton />
      </div>
    </form>);
};
exports.EditMessageForm = EditMessageForm;
var EditMessageModal = function (_a) {
    var additionalMessageInputProps = _a.additionalMessageInputProps;
    var _b = (0, context_1.useComponentContext)().EditMessageInput, EditMessageInput = _b === void 0 ? exports.EditMessageForm : _b;
    var clearEditingState = (0, context_1.useMessageContext)().clearEditingState;
    var messageComposer = (0, hooks_1.useMessageComposer)();
    var onEditModalClose = (0, react_1.useCallback)(function () {
        clearEditingState();
        messageComposer.restore();
    }, [clearEditingState, messageComposer]);
    return (<Modal_1.Modal className='str-chat__edit-message-modal' onClose={onEditModalClose} open={true}>
      <MessageInput_1.MessageInput clearEditingState={clearEditingState} hideSendButton Input={EditMessageInput} {...additionalMessageInputProps}/>
    </Modal_1.Modal>);
};
exports.EditMessageModal = EditMessageModal;
