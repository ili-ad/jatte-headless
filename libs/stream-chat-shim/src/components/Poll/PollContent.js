"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollContent = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var PollHeader_1 = require("./PollHeader");
var PollActions_1 = require("./PollActions");
var PollOptionList_1 = require("./PollOptionList");
var constants_1 = require("./constants");
var context_1 = require("../../context");
var store_1 = require("../../store");
var pollStateSelectorPollContent = function (nextValue) { return ({ is_closed: nextValue.is_closed }); };
var PollContent = function () {
    var _a = (0, context_1.useComponentContext)(), _b = _a.PollActions, PollActions = _b === void 0 ? PollActions_1.PollActions : _b, _c = _a.PollHeader, PollHeader = _c === void 0 ? PollHeader_1.PollHeader : _c;
    var poll = (0, context_1.usePollContext)().poll;
    var is_closed = (0, store_1.useStateStore)(poll.state, pollStateSelectorPollContent).is_closed;
    return (<div className={(0, clsx_1.default)('str-chat__poll', { 'str-chat__poll--closed': is_closed })}>
      <PollHeader />
      <PollOptionList_1.PollOptionList optionsDisplayCount={constants_1.MAX_OPTIONS_DISPLAYED}/>
      <PollActions />
    </div>);
};
exports.PollContent = PollContent;
