"use strict";
// libs/stream-chat-shim/src/channelList-utils.ts
// Lightweight shim for Stream's ChannelList utility helpers.
// Implements minimal versions of helpers used by the UI.
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
exports.isChannelArchived = exports.isChannelPinned = exports.shouldConsiderArchivedChannels = exports.extractSortValue = exports.shouldConsiderPinnedChannels = exports.moveChannelUpwards = exports.moveChannelUp = exports.MAX_QUERY_CHANNELS_LIMIT = void 0;
exports.findLastPinnedChannelIndex = findLastPinnedChannelIndex;
// simple uniqBy helper to avoid extra dependencies
function uniqBy(arr, key) {
    var seen = new Set();
    var out = [];
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var item = arr_1[_i];
        var val = item[key];
        if (!seen.has(val)) {
            seen.add(val);
            out.push(item);
        }
    }
    return out;
}
exports.MAX_QUERY_CHANNELS_LIMIT = 30;
/**
 * @deprecated
 * Minimal re-implementation of Stream's `moveChannelUp` helper.
 */
var moveChannelUp = function (_a) {
    var activeChannel = _a.activeChannel, channels = _a.channels, cid = _a.cid;
    var channelIndex = channels.findIndex(function (channel) { return channel.cid === cid; });
    if (!activeChannel && channelIndex <= 0)
        return channels;
    var channel = activeChannel || channels[channelIndex];
    return uniqBy(__spreadArray([channel], channels, true), 'cid');
};
exports.moveChannelUp = moveChannelUp;
function findLastPinnedChannelIndex(_a) {
    var channels = _a.channels;
    var lastPinnedChannelIndex = null;
    for (var _i = 0, channels_1 = channels; _i < channels_1.length; _i++) {
        var channel = channels_1[_i];
        if (!(0, exports.isChannelPinned)(channel))
            break;
        if (typeof lastPinnedChannelIndex === 'number') {
            lastPinnedChannelIndex++;
        }
        else {
            lastPinnedChannelIndex = 0;
        }
    }
    return lastPinnedChannelIndex;
}
var moveChannelUpwards = function (_a) {
    var channels = _a.channels, channelToMove = _a.channelToMove, channelToMoveIndexWithinChannels = _a.channelToMoveIndexWithinChannels, sort = _a.sort;
    var targetChannelIndex = channelToMoveIndexWithinChannels !== null && channelToMoveIndexWithinChannels !== void 0 ? channelToMoveIndexWithinChannels : channels.findIndex(function (c) { return c.cid === channelToMove.cid; });
    var targetChannelExistsWithinList = targetChannelIndex >= 0;
    var targetChannelAlreadyAtTheTop = targetChannelIndex === 0;
    var considerPinnedChannels = (0, exports.shouldConsiderPinnedChannels)(sort);
    var isTargetChannelPinned = (0, exports.isChannelPinned)(channelToMove);
    if (targetChannelAlreadyAtTheTop || (considerPinnedChannels && isTargetChannelPinned)) {
        return channels;
    }
    var newChannels = __spreadArray([], channels, true);
    if (targetChannelExistsWithinList) {
        newChannels.splice(targetChannelIndex, 1);
    }
    var lastPinnedChannelIndex = null;
    if (considerPinnedChannels) {
        lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
    }
    newChannels.splice(typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0, 0, channelToMove);
    return newChannels;
};
exports.moveChannelUpwards = moveChannelUpwards;
var shouldConsiderPinnedChannels = function (sort) {
    var value = (0, exports.extractSortValue)({ atIndex: 0, sort: sort, targetKey: 'pinned_at' });
    if (typeof value !== 'number')
        return false;
    return Math.abs(value) === 1;
};
exports.shouldConsiderPinnedChannels = shouldConsiderPinnedChannels;
var extractSortValue = function (_a) {
    var _b, _c;
    var atIndex = _a.atIndex, sort = _a.sort, targetKey = _a.targetKey;
    if (!sort)
        return null;
    var option = null;
    if (Array.isArray(sort)) {
        option = (_b = sort[atIndex]) !== null && _b !== void 0 ? _b : null;
    }
    else {
        var index = 0;
        for (var key in sort) {
            if (index !== atIndex) {
                index++;
                continue;
            }
            if (key !== targetKey) {
                return null;
            }
            option = sort;
            break;
        }
    }
    return (_c = option === null || option === void 0 ? void 0 : option[targetKey]) !== null && _c !== void 0 ? _c : null;
};
exports.extractSortValue = extractSortValue;
var shouldConsiderArchivedChannels = function (filters) {
    if (!filters)
        return false;
    return typeof filters.archived === 'boolean';
};
exports.shouldConsiderArchivedChannels = shouldConsiderArchivedChannels;
var isChannelPinned = function (channel) {
    if (!channel)
        return false;
    var membership = channel.state.membership;
    return typeof membership.pinned_at === 'string';
};
exports.isChannelPinned = isChannelPinned;
var isChannelArchived = function (channel) {
    if (!channel)
        return false;
    var membership = channel.state.membership;
    return typeof membership.archived_at === 'string';
};
exports.isChannelArchived = isChannelArchived;
