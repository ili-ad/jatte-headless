"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollActions = void 0;
var react_1 = require("react");
var PollAction = (function () { return null; }); // temporary shim
var DefaultAddCommentForm = (function () { return null; }); // temporary shim
var DefaultSuggestPollOptionForm = (function () { return null; }); // temporary shim
var DefaultEndPollDialog = (function () { return null; }); // temporary shim
var DefaultPollAnswerList = (function () { return null; }); // temporary shim
var DefaultPollOptionsFullList = (function () { return null; }); // temporary shim
var DefaultPollResults = (function () { return null; }); // temporary shim
var MAX_OPTIONS_DISPLAYED = 10;
var MAX_POLL_OPTIONS = 100;
// import {
//   useChannelStateContext,
//   useChatContext,
//   useMessageContext,
//   usePollContext,
//   useTranslationContext,
var useChannelStateContext = function (_) { return ({ channelCapabilities: {} }); };
var useChatContext = function (_) { return ({ client: {} }); };
var useMessageContext = function (_) { return ({ message: { id: '' } }); };
var usePollContext = function (_) { return ({ poll: { state: {} } }); };
var useTranslationContext = function (_) { return ({ t: function (s, _) { return s; } }); };
var useStateStore = function (_store, _selector) { return ({
    allow_answers: false,
    allow_user_suggested_options: false,
    answers_count: 0,
    created_by_id: '',
    is_closed: false,
    options: [],
    ownAnswer: undefined,
}); };
var pollStateSelector = function (nextValue) { return ({
    allow_answers: nextValue.allow_answers,
    allow_user_suggested_options: nextValue.allow_user_suggested_options,
    answers_count: nextValue.answers_count,
    created_by_id: nextValue.created_by_id,
    is_closed: nextValue.is_closed,
    options: nextValue.options,
    ownAnswer: nextValue.ownAnswer,
}); };
var PollActions = function (_a) {
    var _b;
    var _c = _a.AddCommentForm, AddCommentForm = _c === void 0 ? DefaultAddCommentForm : _c, _d = _a.EndPollDialog, EndPollDialog = _d === void 0 ? DefaultEndPollDialog : _d, _e = _a.PollAnswerList, PollAnswerList = _e === void 0 ? DefaultPollAnswerList : _e, _f = _a.PollOptionsFullList, PollOptionsFullList = _f === void 0 ? DefaultPollOptionsFullList : _f, _g = _a.PollResults, PollResults = _g === void 0 ? DefaultPollResults : _g, _h = _a.SuggestPollOptionForm, SuggestPollOptionForm = _h === void 0 ? DefaultSuggestPollOptionForm : _h;
    var client = useChatContext().client;
    var t = useTranslationContext('PollActions').t;
    var _j = useChannelStateContext('PollActions').channelCapabilities, channelCapabilities = _j === void 0 ? {} : _j;
    var message = useMessageContext('PollActions').message;
    var poll = usePollContext().poll;
    var _k = useStateStore(poll.state, pollStateSelector), allow_answers = _k.allow_answers, allow_user_suggested_options = _k.allow_user_suggested_options, answers_count = _k.answers_count, created_by_id = _k.created_by_id, is_closed = _k.is_closed, options = _k.options, ownAnswer = _k.ownAnswer;
    var _l = (0, react_1.useState)(), modalOpen = _l[0], setModalOpen = _l[1];
    var closeModal = (0, react_1.useCallback)(function () { return setModalOpen(undefined); }, []);
    var onUpdateAnswerClick = (0, react_1.useCallback)(function () { return setModalOpen('add-comment'); }, []);
    return (<div className='str-chat__poll-actions'>
      {options.length > MAX_OPTIONS_DISPLAYED && (<PollAction buttonText={t('See all options ({{count}})', {
                count: options.length,
            })} closeModal={closeModal} modalIsOpen={modalOpen === 'view-all-options'} openModal={function () { return setModalOpen('view-all-options'); }}>
          <PollOptionsFullList close={closeModal}/>
        </PollAction>)}

      {!is_closed &&
            allow_user_suggested_options &&
            options.length < MAX_POLL_OPTIONS && (<PollAction buttonText={t('Suggest an option')} closeModal={closeModal} modalClassName='str-chat__suggest-poll-option-modal' modalIsOpen={modalOpen === 'suggest-option'} openModal={function () { return setModalOpen('suggest-option'); }}>
            <SuggestPollOptionForm close={closeModal} messageId={message.id}/>
          </PollAction>)}

      {!is_closed && allow_answers && (<PollAction buttonText={ownAnswer ? t('Update your comment') : t('Add a comment')} closeModal={closeModal} modalClassName='str-chat__add-poll-answer-modal' modalIsOpen={modalOpen === 'add-comment'} openModal={function () { return setModalOpen('add-comment'); }}>
          <AddCommentForm close={closeModal} messageId={message.id}/>
        </PollAction>)}

      {answers_count > 0 && channelCapabilities['query-poll-votes'] && (<PollAction buttonText={t('View {{count}} comments', { count: answers_count })} closeModal={closeModal} modalClassName='str-chat__poll-answer-list-modal' modalIsOpen={modalOpen === 'view-comments'} openModal={function () { return setModalOpen('view-comments'); }}>
          <PollAnswerList close={closeModal} onUpdateOwnAnswerClick={onUpdateAnswerClick}/>
        </PollAction>)}

      <PollAction buttonText={t('View results')} closeModal={closeModal} modalClassName='str-chat__poll-results-modal' modalIsOpen={modalOpen === 'view-results'} openModal={function () { return setModalOpen('view-results'); }}>
        <PollResults close={closeModal}/>
      </PollAction>

      {!is_closed && created_by_id === ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id) && (<PollAction buttonText={t('End vote')} closeModal={closeModal} modalClassName='str-chat__end-poll-modal' modalIsOpen={modalOpen === 'end-vote'} openModal={function () { return setModalOpen('end-vote'); }}>
          <EndPollDialog close={closeModal}/>
        </PollAction>)}
    </div>);
};
exports.PollActions = PollActions;
