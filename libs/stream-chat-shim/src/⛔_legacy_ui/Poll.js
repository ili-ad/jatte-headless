"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poll = void 0;
var react_1 = require("react");
var Poll = function (_a) {
    var isQuoted = _a.isQuoted;
    return (<div data-testid={isQuoted ? 'quoted-poll-placeholder' : 'poll-placeholder'}>
      Poll placeholder
    </div>);
};
exports.Poll = Poll;
exports.default = exports.Poll;
