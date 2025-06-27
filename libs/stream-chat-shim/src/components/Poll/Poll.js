"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poll = void 0;
var react_1 = require("react");
var PollContent_1 = require("./PollContent");
var QuotedPoll_1 = require("./QuotedPoll");
var context_1 = require("../../context");
var Poll = function (_a) {
    var isQuoted = _a.isQuoted, poll = _a.poll;
    var _b = (0, context_1.useComponentContext)(), _c = _b.PollContent, PollContent = _c === void 0 ? PollContent_1.PollContent : _c, _d = _b.QuotedPoll, QuotedPoll = _d === void 0 ? QuotedPoll_1.QuotedPoll : _d;
    return poll ? (<context_1.PollProvider poll={poll}>{isQuoted ? <QuotedPoll /> : <PollContent />}</context_1.PollProvider>) : null;
};
exports.Poll = Poll;
