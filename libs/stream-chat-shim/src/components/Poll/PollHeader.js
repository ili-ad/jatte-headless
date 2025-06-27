"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollHeader = void 0;
var react_1 = require("react");
var context_1 = require("../../context");
var store_1 = require("../../store");
var pollStateSelector = function (nextValue) { return ({
    enforce_unique_vote: nextValue.enforce_unique_vote,
    is_closed: nextValue.is_closed,
    max_votes_allowed: nextValue.max_votes_allowed,
    name: nextValue.name,
    options: nextValue.options,
}); };
var PollHeader = function () {
    var t = (0, context_1.useTranslationContext)('PollHeader').t;
    var poll = (0, context_1.usePollContext)().poll;
    var _a = (0, store_1.useStateStore)(poll.state, pollStateSelector), enforce_unique_vote = _a.enforce_unique_vote, is_closed = _a.is_closed, max_votes_allowed = _a.max_votes_allowed, name = _a.name, options = _a.options;
    var selectionInstructions = (0, react_1.useMemo)(function () {
        if (is_closed)
            return t('Vote ended');
        if (enforce_unique_vote || options.length === 1)
            return t('Select one');
        if (max_votes_allowed)
            return t('Select up to {{count}}', {
                count: max_votes_allowed > options.length ? options.length : max_votes_allowed,
            });
        if (options.length > 1)
            return t('Select one or more');
        return '';
    }, [is_closed, enforce_unique_vote, max_votes_allowed, options.length, t]);
    if (!name)
        return;
    return (<div className='str-chat__poll-header'>
      <div className='str-chat__poll-title'>{name}</div>
      <div className='str-chat__poll-subtitle'>{selectionInstructions}</div>
    </div>);
};
exports.PollHeader = PollHeader;
