"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotedPoll = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var usePollContext = function () { return ({ poll: { state: {} } }); };
var useStateStore = function (_store, _selector) { return ({
    is_closed: false,
    name: '',
}); };
var pollStateSelectorQuotedPoll = function (nextValue) { return ({
    is_closed: nextValue.is_closed,
    name: nextValue.name,
}); };
var QuotedPoll = function () {
    var poll = usePollContext().poll;
    var _a = useStateStore(poll.state, pollStateSelectorQuotedPoll), is_closed = _a.is_closed, name = _a.name;
    return (<div className={(0, clsx_1.default)('str-chat__quoted-poll-preview', {
            'str-chat__quoted-poll-preview--closed': is_closed,
        })}>
      <div className='str-chat__quoted-poll-preview__icon'>📊</div>
      <div className='str-chat__quoted-poll-preview__name'>{name}</div>
    </div>);
};
exports.QuotedPoll = QuotedPoll;
exports.default = exports.QuotedPoll;
