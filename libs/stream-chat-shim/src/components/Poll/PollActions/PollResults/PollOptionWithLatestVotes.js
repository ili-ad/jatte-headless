"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionWithLatestVotes = void 0;
var react_1 = require("react");
var PollOptionWithVotesHeader_1 = require("./PollOptionWithVotesHeader");
var PollVote_1 = require("../../PollVote");
var store_1 = require("../../../../store");
from;
'stream-chat';
useChannelStateContext,
    usePollContext,
    useTranslationContext,
;
from;
'../../../../context';
var pollStateSelector = function (nextValue) { return ({
    latest_votes_by_option: nextValue.latest_votes_by_option,
}); };
var PollOptionWithLatestVotes = function (_a) {
    var _b = _a.countVotesPreview, countVotesPreview = _b === void 0 ? 5 : _b, option = _a.option, showAllVotes = _a.showAllVotes;
    var t = useTranslationContext().t;
    var _c = useChannelStateContext('PollOptionWithLatestVotes').channelCapabilities, channelCapabilities = _c === void 0 ? {} : _c;
    var poll = usePollContext().poll;
    var latest_votes_by_option = (0, store_1.useStateStore)(poll.state, pollStateSelector).latest_votes_by_option;
    var votes = latest_votes_by_option && latest_votes_by_option[option.id];
    return (<div className='str-chat__poll-option'>
      <PollOptionWithVotesHeader_1.PollOptionWithVotesHeader option={option}/>
      {votes && <PollVote_1.PollVoteListing votes={votes.slice(0, countVotesPreview)}/>}
      {channelCapabilities['query-poll-votes'] &&
            showAllVotes &&
            (votes === null || votes === void 0 ? void 0 : votes.length) > countVotesPreview && (<button className='str-chat__poll-option__show-all-votes-button' onClick={showAllVotes}>
            {t('Show all')}
          </button>)}
    </div>);
};
exports.PollOptionWithLatestVotes = PollOptionWithLatestVotes;
