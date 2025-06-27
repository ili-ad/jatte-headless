"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameField = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var FieldError_1 = require("../../Form/FieldError");
var context_1 = require("../../../context");
var MessageInput_1 = require("../../MessageInput");
var store_1 = require("../../../store");
var pollComposerStateSelector = function (state) { return ({
    error: state.errors.name,
    name: state.data.name,
}); };
var NameField = function () {
    var t = (0, context_1.useTranslationContext)().t;
    var pollComposer = (0, MessageInput_1.useMessageComposer)().pollComposer;
    var _a = (0, store_1.useStateStore)(pollComposer.state, pollComposerStateSelector), error = _a.error, name = _a.name;
    return (<div className={(0, clsx_1.default)('str-chat__form__field str-chat__form__input-field str-chat__form__input-field--with-label', {
            'str-chat__form__input-field--has-error': error,
        })}>
      <label className='str-chat__form__field-label' htmlFor='name'>
        {t('Question')}
      </label>
      <div className={(0, clsx_1.default)('str-chat__form__input-field__value')}>
        <FieldError_1.FieldError className='str-chat__form__input-field__error' data-testid={'poll-name-input-field-error'} text={error && t(error)}/>
        <input id='name' onBlur={function () {
            pollComposer.handleFieldBlur('name');
        }} onChange={function (e) {
            pollComposer.updateFields({ name: e.target.value });
        }} placeholder={t('Ask a question')} type='text' value={name}/>
      </div>
    </div>);
};
exports.NameField = NameField;
