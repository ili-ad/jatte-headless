"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionSelector = exports.Checkmark = exports.AmountBar = void 0;
var clsx_1 = require("clsx");
var lodash_debounce_1 = require("lodash.debounce");
var react_1 = require("react");
var chat_shim_1 = require("chat-shim");
var Avatar_1 = require("../Avatar");
// import {
//   useChannelStateContext,
//   useMessageContext,
//   usePollContext,
//   useTranslationContext,
var useChannelStateContext = function (_) { return ({ channelCapabilities: {} }); };
var useMessageContext = function () { return ({ message: { id: '' } }); };
var usePollContext = function () { return ({ poll: { state: {} } }); };
var useTranslationContext = function () { return ({ t: function (s, _) { return s; } }); };
var useStateStore = function (_store, _selector) { return ({
    is_closed: false,
    latest_votes_by_option: {},
    maxVotedOptionIds: [],
    ownVotesByOptionId: {},
    vote_counts_by_option: {},
    voting_visibility: undefined,
}); };
var AmountBar = function (_a) {
    var amount = _a.amount, className = _a.className;
    return (<div className={(0, clsx_1.default)('str-chat__amount-bar', className)} data-testid='amount-bar' role='progressbar' style={{
            '--str-chat__amount-bar-fulfillment': amount + '%',
        }}/>);
};
exports.AmountBar = AmountBar;
var Checkmark = function (_a) {
    var checked = _a.checked;
    return (<div className={(0, clsx_1.default)('str-chat__checkmark', { 'str-chat__checkmark--checked': checked })}/>);
};
exports.Checkmark = Checkmark;
var pollStateSelector = function (nextValue) { return ({
    is_closed: nextValue.is_closed,
    latest_votes_by_option: nextValue.latest_votes_by_option,
    maxVotedOptionIds: nextValue.maxVotedOptionIds,
    ownVotesByOptionId: nextValue.ownVotesByOptionId,
    vote_counts_by_option: nextValue.vote_counts_by_option,
    voting_visibility: nextValue.voting_visibility,
}); };
var PollOptionSelector = function (_a) {
    var _b, _c, _d;
    var displayAvatarCount = _a.displayAvatarCount, option = _a.option, voteCountVerbose = _a.voteCountVerbose;
    var t = useTranslationContext().t;
    var _e = useChannelStateContext('PollOptionsShortlist').channelCapabilities, channelCapabilities = _e === void 0 ? {} : _e;
    var message = useMessageContext().message;
    var poll = usePollContext().poll;
    var _f = useStateStore(poll.state, pollStateSelector), is_closed = _f.is_closed, latest_votes_by_option = _f.latest_votes_by_option, maxVotedOptionIds = _f.maxVotedOptionIds, ownVotesByOptionId = _f.ownVotesByOptionId, vote_counts_by_option = _f.vote_counts_by_option, voting_visibility = _f.voting_visibility;
    var canCastVote = channelCapabilities['cast-poll-vote'] && !is_closed;
    var winningOptionCount = maxVotedOptionIds[0]
        ? vote_counts_by_option[maxVotedOptionIds[0]]
        : 0;
    var toggleVote = (0, react_1.useMemo)(function () {
        return (0, lodash_debounce_1.default)(function () {
            if (!canCastVote)
                return;
            var haveVotedForTheOption = !!ownVotesByOptionId[option.id];
            return haveVotedForTheOption
                ? poll.removeVote(ownVotesByOptionId[option.id].id, message.id)
                : poll.castVote(option.id, message.id);
        }, 100);
    }, [canCastVote, message.id, option.id, ownVotesByOptionId, poll]);
    return (<div className={(0, clsx_1.default)('str-chat__poll-option', {
            'str-chat__poll-option--votable': canCastVote,
        })} key={"base-poll-option-".concat(option.id)} onClick={toggleVote}>
      {canCastVote && <exports.Checkmark checked={!!ownVotesByOptionId[option.id]}/>}
      <div className='str-chat__poll-option-data'>
        <p className='str-chat__poll-option-text'>{option.text}</p>
        {displayAvatarCount && voting_visibility === 'public' && (<div className='str-chat__poll-option-voters'>
            {(latest_votes_by_option === null || latest_votes_by_option === void 0 ? void 0 : latest_votes_by_option[option.id]) &&
                latest_votes_by_option[option.id]
                    .filter(function (vote) { return !!vote.user && !(0, chat_shim_1.isVoteAnswer)(vote); })
                    .slice(0, displayAvatarCount)
                    .map(function (_a) {
                    var user = _a.user;
                    return (<Avatar_1.Avatar image={user === null || user === void 0 ? void 0 : user.image} key={"poll-option-".concat(option.id, "-avatar-").concat(user === null || user === void 0 ? void 0 : user.id)} name={user === null || user === void 0 ? void 0 : user.name}/>);
                })}
          </div>)}
        <div className='str-chat__poll-option-vote-count'>
          {voteCountVerbose
            ? t('{{count}} votes', {
                count: (_b = vote_counts_by_option[option.id]) !== null && _b !== void 0 ? _b : 0,
            })
            : (_c = vote_counts_by_option[option.id]) !== null && _c !== void 0 ? _c : 0}
        </div>
      </div>
      <exports.AmountBar amount={(winningOptionCount &&
            ((_d = vote_counts_by_option[option.id]) !== null && _d !== void 0 ? _d : 0) / winningOptionCount) * 100} className={(0, clsx_1.default)('str-chat__poll-option__votes-bar', {
            'str-chat__poll-option__votes-bar--winner': is_closed &&
                maxVotedOptionIds.length === 1 &&
                maxVotedOptionIds[0] === option.id,
        })}/>
    </div>);
};
exports.PollOptionSelector = PollOptionSelector;
exports.default = exports.PollOptionSelector;
