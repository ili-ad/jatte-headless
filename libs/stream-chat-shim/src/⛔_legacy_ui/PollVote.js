"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollVote = void 0;
var react_1 = require("react");
/**
 * Placeholder component for Stream's PollVote.
 */
var PollVote = function (_a) {
    var _b;
    var vote = _a.vote;
    return (<div data-testid="poll-vote-placeholder">{(_b = vote.option_id) !== null && _b !== void 0 ? _b : vote.id}</div>);
};
exports.PollVote = PollVote;
exports.default = exports.PollVote;
