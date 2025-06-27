"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipleAnswersField = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var SwitchField_1 = require("../../Form/SwitchField");
var FieldError_1 = require("../../Form/FieldError");
var context_1 = require("../../../context");
var MessageInput_1 = require("../../MessageInput");
var store_1 = require("../../../store");
var pollComposerStateSelector = function (state) { return ({
    enforce_unique_vote: state.data.enforce_unique_vote,
    error: state.errors.max_votes_allowed,
    max_votes_allowed: state.data.max_votes_allowed,
}); };
var MultipleAnswersField = function () {
    var t = (0, context_1.useTranslationContext)().t;
    var pollComposer = (0, MessageInput_1.useMessageComposer)().pollComposer;
    var _a = (0, store_1.useStateStore)(pollComposer.state, pollComposerStateSelector), enforce_unique_vote = _a.enforce_unique_vote, error = _a.error, max_votes_allowed = _a.max_votes_allowed;
    return (<div className={(0, clsx_1.default)('str-chat__form__expandable-field', {
            'str-chat__form__expandable-field--expanded': !enforce_unique_vote,
        })}>
      <SwitchField_1.SimpleSwitchField checked={!enforce_unique_vote} id='enforce_unique_vote' labelText={t('Multiple answers')} onChange={function (e) {
            pollComposer.updateFields({ enforce_unique_vote: !e.target.checked });
        }}/>
      {!enforce_unique_vote && (<div className={(0, clsx_1.default)('str-chat__form__input-field', {
                'str-chat__form__input-field--has-error': error,
            })}>
          <div className={(0, clsx_1.default)('str-chat__form__input-field__value')}>
            <FieldError_1.FieldError className='str-chat__form__input-field__error' data-testid={'poll-max-votes-allowed-input-field-error'} text={error && t(error)}/>
            <input id='max_votes_allowed' onBlur={function () {
                pollComposer.handleFieldBlur('max_votes_allowed');
            }} onChange={function (e) {
                var nativeFieldValidation = !e.target.validity.valid
                    ? {
                        max_votes_allowed: t('Only numbers are allowed'),
                    }
                    : undefined;
                pollComposer.updateFields({
                    max_votes_allowed: !nativeFieldValidation
                        ? e.target.value
                        : pollComposer.max_votes_allowed,
                }, nativeFieldValidation);
            }} placeholder={t('Maximum number of votes (from 2 to 10)')} type='number' value={max_votes_allowed}/>
          </div>
        </div>)}
    </div>);
};
exports.MultipleAnswersField = MultipleAnswersField;
