"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionWithVotesHeader = exports.PollResultOptionVoteCounter = void 0;
var react_1 = require("react");
var store_1 = require("../../../../store");
var context_1 = require("../../../../context");
var pollStateSelector = function (nextValue) { return ({
    maxVotedOptionIds: nextValue.maxVotedOptionIds,
    vote_counts_by_option: nextValue.vote_counts_by_option,
}); };
var PollResultOptionVoteCounter = function (_a) {
    var _b;
    var optionId = _a.optionId;
    var t = (0, context_1.useTranslationContext)().t;
    var poll = (0, context_1.usePollContext)().poll;
    var _c = (0, store_1.useStateStore)(poll.state, pollStateSelector), maxVotedOptionIds = _c.maxVotedOptionIds, vote_counts_by_option = _c.vote_counts_by_option;
    return (<div className='str-chat__poll-result-option-vote-counter'>
      {maxVotedOptionIds.length === 1 && maxVotedOptionIds[0] === optionId && (<div className='str-chat__poll-result-winning-option-icon'/>)}
      <span className='str-chat__poll-result-option-vote-count'>
        {t('{{count}} votes', { count: (_b = vote_counts_by_option[optionId]) !== null && _b !== void 0 ? _b : 0 })}
      </span>
    </div>);
};
exports.PollResultOptionVoteCounter = PollResultOptionVoteCounter;
var PollOptionWithVotesHeader = function (_a) {
    var option = _a.option;
    return (<div className='str-chat__poll-option__header'>
    <div className='str-chat__poll-option__option-text'>{option.text}</div>
    <exports.PollResultOptionVoteCounter optionId={option.id}/>
  </div>);
};
exports.PollOptionWithVotesHeader = PollOptionWithVotesHeader;
