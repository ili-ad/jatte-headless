"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useManagePollVotesRealtime = useManagePollVotesRealtime;
var react_1 = require("react");
/**
 * Placeholder for Stream\'s `useManagePollVotesRealtime` hook.
 *
 * Maintains a list of votes, but does not subscribe to real-time events yet.
 */
function useManagePollVotesRealtime(_managedVoteType, cursorPaginatorState, _optionId) {
    var _a;
    var _b = (0, react_1.useState)((_a = cursorPaginatorState === null || cursorPaginatorState === void 0 ? void 0 : cursorPaginatorState.getLatestValue().items) !== null && _a !== void 0 ? _a : []), votesInRealtime = _b[0], setVotesInRealtime = _b[1];
    (0, react_1.useEffect)(function () {
        var _a;
        // TODO: connect to Stream Chat client and handle vote events
        setVotesInRealtime((_a = cursorPaginatorState === null || cursorPaginatorState === void 0 ? void 0 : cursorPaginatorState.getLatestValue().items) !== null && _a !== void 0 ? _a : []);
    }, [cursorPaginatorState]);
    return votesInRealtime;
}
