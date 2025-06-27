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
exports.generateMessageId = exports.findInMsgSetByDate = exports.findInMsgSetById = exports.makeAddNotifications = void 0;
var nanoid_1 = require("nanoid");
var makeAddNotifications = function (setNotifications, notificationTimeouts) {
    return function (text, type) {
        if (typeof text !== 'string' || (type !== 'success' && type !== 'error')) {
            return;
        }
        var id = (0, nanoid_1.nanoid)();
        setNotifications(function (prevNotifications) { return __spreadArray(__spreadArray([], prevNotifications, true), [{ id: id, text: text, type: type }], false); });
        var timeout = setTimeout(function () {
            return setNotifications(function (prevNotifications) {
                return prevNotifications.filter(function (notification) { return notification.id !== id; });
            });
        }, 5000);
        notificationTimeouts.push(timeout);
    };
};
exports.makeAddNotifications = makeAddNotifications;
/**
 * Utility function for jumpToFirstUnreadMessage
 * @param targetId
 * @param msgSet
 */
var findInMsgSetById = function (targetId, msgSet) {
    for (var i = msgSet.length - 1; i >= 0; i--) {
        var item = msgSet[i];
        if (item.id === targetId) {
            return {
                index: i,
                target: item,
            };
        }
    }
    return {
        index: -1,
    };
};
exports.findInMsgSetById = findInMsgSetById;
/**
 * Utility function for jumpToFirstUnreadMessage
 * @param targetDate
 * @param msgSet
 * @param exact
 */
var findInMsgSetByDate = function (targetDate, msgSet, exact) {
    var _a, _b;
    if (exact === void 0) { exact = false; }
    var targetTimestamp = targetDate.getTime();
    var left = 0;
    var middle = 0;
    var right = msgSet.length - 1;
    while (left <= right) {
        middle = Math.floor((right + left) / 2);
        var middleTimestamp = new Date(msgSet[middle].created_at).getTime();
        var middleLeftTimestamp = ((_a = msgSet[middle - 1]) === null || _a === void 0 ? void 0 : _a.created_at) &&
            new Date(msgSet[middle - 1].created_at).getTime();
        var middleRightTimestamp = ((_b = msgSet[middle + 1]) === null || _b === void 0 ? void 0 : _b.created_at) &&
            new Date(msgSet[middle + 1].created_at).getTime();
        if (middleTimestamp === targetTimestamp ||
            (middleLeftTimestamp &&
                middleRightTimestamp &&
                middleLeftTimestamp < targetTimestamp &&
                targetTimestamp < middleRightTimestamp)) {
            return { index: middle, target: msgSet[middle] };
        }
        if (middleTimestamp < targetTimestamp)
            left = middle + 1;
        else
            right = middle - 1;
    }
    if (!exact ||
        new Date(msgSet[left].created_at).getTime() === targetTimestamp) {
        return { index: left, target: msgSet[left] };
    }
    return { index: -1 };
};
exports.findInMsgSetByDate = findInMsgSetByDate;
var generateMessageId = function (_a) {
    var client = _a.client;
    return "".concat(client.userID, "-").concat((0, nanoid_1.nanoid)());
};
exports.generateMessageId = generateMessageId;
