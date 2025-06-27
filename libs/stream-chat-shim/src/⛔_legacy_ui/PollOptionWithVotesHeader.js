"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionWithVotesHeader = exports.PollResultOptionVoteCounter = void 0;
var react_1 = require("react");
/** Placeholder vote counter for poll options. */
var PollResultOptionVoteCounter = function (_a) {
    var optionId = _a.optionId;
    return (<span data-testid="poll-result-option-vote-counter"/>);
};
exports.PollResultOptionVoteCounter = PollResultOptionVoteCounter;
/** Minimal placeholder for Stream's PollOptionWithVotesHeader component. */
var PollOptionWithVotesHeader = function (_a) {
    var option = _a.option;
    return (<div className='str-chat__poll-option__header' data-testid='poll-option-with-votes-header'>
    <div className='str-chat__poll-option__option-text'>{option.text}</div>
    <exports.PollResultOptionVoteCounter optionId={option.id}/>
  </div>);
};
exports.PollOptionWithVotesHeader = PollOptionWithVotesHeader;
exports.default = exports.PollOptionWithVotesHeader;
