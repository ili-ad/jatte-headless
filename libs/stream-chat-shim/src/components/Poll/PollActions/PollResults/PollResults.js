"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollResults = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var PollOptionVotesList_1 = require("./PollOptionVotesList");
var PollOptionWithLatestVotes_1 = require("./PollOptionWithLatestVotes");
var ModalHeader_1 = require("../../../Modal/ModalHeader");
var store_1 = require("../../../../store");
var context_1 = require("../../../../context");
var pollStateSelector = function (nextValue) { return ({
    name: nextValue.name,
    options: __spreadArray([], nextValue.options, true),
    vote_counts_by_option: nextValue.vote_counts_by_option,
}); };
var PollResults = function (_a) {
    var close = _a.close;
    var t = (0, context_1.useTranslationContext)().t;
    var poll = (0, context_1.usePollContext)().poll;
    var _b = (0, store_1.useStateStore)(poll.state, pollStateSelector), name = _b.name, options = _b.options, vote_counts_by_option = _b.vote_counts_by_option;
    var _c = (0, react_1.useState)(), optionToView = _c[0], setOptionToView = _c[1];
    var goBack = (0, react_1.useCallback)(function () { return setOptionToView(undefined); }, []);
    return (<div className={(0, clsx_1.default)('str-chat__modal__poll-results', {
            'str-chat__modal__poll-results--option-detail': optionToView,
        })}>
      {optionToView ? (<>
          <ModalHeader_1.ModalHeader close={close} goBack={goBack} title={optionToView.text}/>
          <div className='str-chat__modal__poll-results__body'>
            <PollOptionVotesList_1.PollOptionVotesList key={"poll-option-detail-".concat(optionToView.id)} option={optionToView}/>
          </div>
        </>) : (<>
          <ModalHeader_1.ModalHeader close={close} title={t('Poll results')}/>
          <div className='str-chat__modal__poll-results__body'>
            <div className='str-chat__modal__poll-results__title'>{name}</div>
            <div className='str-chat__modal__poll-results__option-list'>
              {options
                .sort(function (next, current) {
                var _a, _b;
                return ((_a = vote_counts_by_option[current.id]) !== null && _a !== void 0 ? _a : 0) >=
                    ((_b = vote_counts_by_option[next.id]) !== null && _b !== void 0 ? _b : 0)
                    ? 1
                    : -1;
            })
                .map(function (option) { return (<PollOptionWithLatestVotes_1.PollOptionWithLatestVotes key={"poll-option-".concat(option.id)} option={option} showAllVotes={function () { return setOptionToView(option); }}/>); })}
            </div>
          </div>
        </>)}
    </div>);
};
exports.PollResults = PollResults;
