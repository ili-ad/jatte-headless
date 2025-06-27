"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialState = exports.makeChannelReducer = void 0;
var makeChannelReducer = function () {
    return function (state, _action) { return state; };
};
exports.makeChannelReducer = makeChannelReducer;
exports.initialState = {
    error: null,
    hasMore: true,
    hasMoreNewer: false,
    loading: true,
    loadingMore: false,
    members: {},
    messages: [],
    pinnedMessages: [],
    read: {},
    suppressAutoscroll: false,
    thread: null,
    threadHasMore: true,
    threadLoadingMore: false,
    threadMessages: [],
    threadSuppressAutoscroll: false,
    typing: {},
    watcherCount: 0,
    watchers: {},
};
