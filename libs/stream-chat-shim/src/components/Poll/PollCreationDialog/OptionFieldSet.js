"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionFieldSet = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var FieldError_1 = require("../../Form/FieldError");
var DragAndDropContainer_1 = require("../../DragAndDrop/DragAndDropContainer");
var context_1 = require("../../../context");
var MessageInput_1 = require("../../MessageInput");
var store_1 = require("../../../store");
var pollComposerStateSelector = function (state) { return ({
    errors: state.errors.options,
    options: state.data.options,
}); };
var OptionFieldSet = function () {
    var pollComposer = (0, MessageInput_1.useMessageComposer)().pollComposer;
    var _a = (0, store_1.useStateStore)(pollComposer.state, pollComposerStateSelector), errors = _a.errors, options = _a.options;
    var t = (0, context_1.useTranslationContext)('OptionFieldSet').t;
    var onSetNewOrder = (0, react_1.useCallback)(function (newOrder) {
        var prevOptions = pollComposer.options;
        pollComposer.updateFields({ options: newOrder.map(function (index) { return prevOptions[index]; }) });
    }, [pollComposer]);
    var draggable = options.length > 1;
    return (<fieldset className='str-chat__form__field str-chat__form__input-fieldset'>
      <legend className='str-chat__form__field-label'>{t('Options')}</legend>
      <DragAndDropContainer_1.DragAndDropContainer className='str-chat__form__input-fieldset__values' draggable={draggable} onSetNewOrder={onSetNewOrder}>

        {options.map(function (option, i) {
            var error = errors === null || errors === void 0 ? void 0 : errors[option.id];
            return (<div className={(0, clsx_1.default)('str-chat__form__input-field', {
                    'str-chat__form__input-field--draggable': draggable,
                    'str-chat__form__input-field--has-error': error,
                })} key={"new-poll-option-".concat(i)}>
              <div className='str-chat__form__input-field__value'>
                <FieldError_1.FieldError className='str-chat__form__input-field__error' data-testid={'poll-option-input-field-error'} text={error && t(error)}/>
                <input id={option.id} onBlur={function () {
                    pollComposer.handleFieldBlur('options');
                }} onChange={function (e) {
                    pollComposer.updateFields({
                        options: { index: i, text: e.target.value },
                    });
                }} onKeyUp={function (event) {
                    var _a;
                    if (event.key === 'Enter') {
                        var nextInputId = options[i + 1].id;
                        (_a = document.getElementById(nextInputId)) === null || _a === void 0 ? void 0 : _a.focus();
                    }
                }} placeholder={t('Add an option')} type='text' value={option.text}/>
              </div>
              {draggable && <div className='str-chat__drag-handle'/>}
            </div>);
        })}
      </DragAndDropContainer_1.DragAndDropContainer>
    </fieldset>);
};
exports.OptionFieldSet = OptionFieldSet;
