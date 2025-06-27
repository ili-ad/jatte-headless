"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollCreationDialog = void 0;
var react_1 = require("react");
var stream_chat_1 = require("stream-chat");
var MultipleAnswersField_1 = require("./MultipleAnswersField");
var NameField_1 = require("./NameField");
var OptionFieldSet_1 = require("./OptionFieldSet");
var PollCreationDialogControls_1 = require("./PollCreationDialogControls");
var ModalHeader_1 = require("../../Modal/ModalHeader");
var SwitchField_1 = require("../../Form/SwitchField");
var MessageInput_1 = require("../../MessageInput");
var context_1 = require("../../../context");
var store_1 = require("../../../store");
var pollComposerStateSelector = function (state) { return ({
    allow_answers: state.data.allow_answers,
    allow_user_suggested_options: state.data.allow_user_suggested_options,
    voting_visibility: state.data.voting_visibility,
}); };
var PollCreationDialog = function (_a) {
    var close = _a.close;
    var t = (0, context_1.useTranslationContext)().t;
    var pollComposer = (0, MessageInput_1.useMessageComposer)().pollComposer;
    var _b = (0, store_1.useStateStore)(pollComposer.state, pollComposerStateSelector), allow_answers = _b.allow_answers, allow_user_suggested_options = _b.allow_user_suggested_options, voting_visibility = _b.voting_visibility;
    var onClose = (0, react_1.useCallback)(function () {
        pollComposer.initState();
        close();
    }, [pollComposer, close]);
    return (<div className='str-chat__dialog str-chat__poll-creation-dialog' data-testid='poll-creation-dialog'>
      <ModalHeader_1.ModalHeader close={onClose} title={t('Create poll')}/>
      <div className='str-chat__dialog__body'>
        <form autoComplete='off'>
          <NameField_1.NameField />
          <OptionFieldSet_1.OptionFieldSet />
          <MultipleAnswersField_1.MultipleAnswersField />
          <SwitchField_1.SimpleSwitchField checked={voting_visibility === 'anonymous'} id='voting_visibility' labelText={t('Anonymous poll')} onChange={function (e) {
            return pollComposer.updateFields({
                voting_visibility: e.target.checked
                    ? stream_chat_1.VotingVisibility.anonymous
                    : stream_chat_1.VotingVisibility.public,
            });
        }}/>
          <SwitchField_1.SimpleSwitchField checked={allow_user_suggested_options} id='allow_user_suggested_options' labelText={t('Allow option suggestion')} onChange={function (e) {
            return pollComposer.updateFields({
                allow_user_suggested_options: e.target.checked,
            });
        }}/>
          <SwitchField_1.SimpleSwitchField checked={allow_answers} id='allow_answers' labelText={t('Allow comments')} onChange={function (e) {
            return pollComposer.updateFields({ allow_answers: e.target.checked });
        }}/>
        </form>
      </div>
      <PollCreationDialogControls_1.PollCreationDialogControls close={close}/>
    </div>);
};
exports.PollCreationDialog = PollCreationDialog;
