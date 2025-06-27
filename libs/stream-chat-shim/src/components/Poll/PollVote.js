"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollVoteListing = exports.PollVote = void 0;
var react_1 = require("react");
var Avatar_1 = require("../Avatar");
var PopperTooltip = function (_) { return null; };
var useEnterLeaveHandlers = function (_) { return ({
    handleEnter: function () { },
    handleLeave: function () { },
    tooltipVisible: false,
}); };
var context_1 = require("../../context");
var PollVoteTimestamp = function (_a) {
    var timestamp = _a.timestamp;
    var t = (0, context_1.useTranslationContext)().t;
    var _b = useEnterLeaveHandlers(), handleEnter = _b.handleEnter, handleLeave = _b.handleLeave, tooltipVisible = _b.tooltipVisible;
    var _c = (0, react_1.useState)(null), referenceElement = _c[0], setReferenceElement = _c[1];
    var timestampDate = new Date(timestamp);
    return (<div className='str-chat__poll-vote__timestamp' onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={setReferenceElement}>
      {t('timestamp/PollVote', { timestamp: timestampDate })}
      <PopperTooltip offset={[0, 5]} placement='bottom' referenceElement={referenceElement} visible={tooltipVisible}>
        {t('timestamp/PollVoteTooltip', { timestamp: timestampDate })}
      </PopperTooltip>
    </div>);
};
var PollVoteAuthor = function (_a) {
    var _b, _c, _d;
    var vote = _a.vote;
    var t = (0, context_1.useTranslationContext)().t;
    var client = (0, context_1.useChatContext)().client;
    var _e = useEnterLeaveHandlers(), handleEnter = _e.handleEnter, handleLeave = _e.handleLeave, tooltipVisible = _e.tooltipVisible;
    var _f = (0, react_1.useState)(null), referenceElement = _f[0], setReferenceElement = _f[1];
    var displayName = ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id) && client.user.id === ((_c = vote.user) === null || _c === void 0 ? void 0 : _c.id)
        ? t('You')
        : ((_d = vote.user) === null || _d === void 0 ? void 0 : _d.name) || t('Anonymous');
    return (<div className='str-chat__poll-vote__author' onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={setReferenceElement}>
      {vote.user && (<Avatar_1.Avatar className='str-chat__avatar--poll-vote-author' image={vote.user.image} key={"poll-vote-".concat(vote.id, "-avatar-").concat(vote.user.id)} name={vote.user.name}/>)}
      <div className='str-chat__poll-vote__author__name'>{displayName}</div>
      <PopperTooltip offset={[0, 5]} placement='bottom' referenceElement={referenceElement} visible={tooltipVisible}>
        {displayName}
      </PopperTooltip>
    </div>);
};
var PollVote = function (_a) {
    var vote = _a.vote;
    return (<div className='str-chat__poll-vote'>
    <PollVoteAuthor vote={vote}/>
    <PollVoteTimestamp timestamp={vote.created_at}/>
  </div>);
};
exports.PollVote = PollVote;
var PollVoteListing = function (_a) {
    var votes = _a.votes;
    return (<div className='str-chat__poll-vote-listing'>
    {votes.map(function (vote) { return (<exports.PollVote key={"poll-vote-".concat(vote.id)} vote={vote}/>); })}
  </div>);
};
exports.PollVoteListing = PollVoteListing;
