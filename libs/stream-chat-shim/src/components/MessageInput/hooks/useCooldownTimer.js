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
exports.useCooldownTimer = void 0;
var react_1 = require("react");
var context_1 = require("../../../context");
var useCooldownTimer = function () {
    var _a;
    var _b = (0, context_1.useChatContext)('useCooldownTimer'), client = _b.client, latestMessageDatesByChannels = _b.latestMessageDatesByChannels;
    var _c = (0, context_1.useChannelStateContext)('useCooldownTimer'), channel = _c.channel, _d = _c.messages, messages = _d === void 0 ? [] : _d;
    var _e = (0, react_1.useState)(), cooldownRemaining = _e[0], setCooldownRemaining = _e[1];
    var _f = (channel.data ||
        {}), _g = _f.cooldown, cooldownInterval = _g === void 0 ? 0 : _g, own_capabilities = _f.own_capabilities;
    var skipCooldown = own_capabilities === null || own_capabilities === void 0 ? void 0 : own_capabilities.includes('skip-slow-mode');
    var ownLatestMessageDate = (0, react_1.useMemo)(function () {
        var _a, _b;
        return (_a = latestMessageDatesByChannels[channel.cid]) !== null && _a !== void 0 ? _a : (_b = __spreadArray([], messages, true).sort(function (a, b) { var _a, _b; return ((_a = b.created_at) === null || _a === void 0 ? void 0 : _a.getTime()) - ((_b = a.created_at) === null || _b === void 0 ? void 0 : _b.getTime()); })
            .find(function (v) { var _a, _b; return ((_a = v.user) === null || _a === void 0 ? void 0 : _a.id) === ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id); })) === null || _b === void 0 ? void 0 : _b.created_at;
    }, [messages, (_a = client.user) === null || _a === void 0 ? void 0 : _a.id, latestMessageDatesByChannels, channel.cid]);
    (0, react_1.useEffect)(function () {
        var timeSinceOwnLastMessage = ownLatestMessageDate
            ? // prevent negative values
                Math.max(0, (new Date().getTime() - ownLatestMessageDate.getTime()) / 1000)
            : undefined;
        var remaining = !skipCooldown &&
            typeof timeSinceOwnLastMessage !== 'undefined' &&
            cooldownInterval > timeSinceOwnLastMessage
            ? Math.round(cooldownInterval - timeSinceOwnLastMessage)
            : 0;
        setCooldownRemaining(remaining);
        if (!remaining)
            return;
        var timeout = setTimeout(function () {
            setCooldownRemaining(0);
        }, remaining * 1000);
        return function () {
            clearTimeout(timeout);
        };
    }, [cooldownInterval, ownLatestMessageDate, skipCooldown]);
    return {
        cooldownInterval: cooldownInterval,
        cooldownRemaining: cooldownRemaining,
        setCooldownRemaining: setCooldownRemaining,
    };
};
exports.useCooldownTimer = useCooldownTimer;
