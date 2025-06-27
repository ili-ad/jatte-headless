"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMessageDraft = void 0;
// simple nanoid substitute – avoids extra deps
var nanoid = function () { return Math.random().toString(36).slice(2); };
/** Minimal message object generator used by `generateMessageDraft`. */
var generateMessage = function (options) {
    if (options === void 0) { options = {}; }
    var data = __assign({ __html: '<p>regular</p>', attachments: [], created_at: new Date(), html: '<p>regular</p>', id: nanoid(), mentioned_users: [], pinned_at: null, status: 'received', text: nanoid(), type: 'regular', updated_at: new Date(), user: null }, options);
    if (data.reminder) {
        data.reminder.message_id = data.id;
    }
    return data;
};
/**
 * Generates a `DraftResponse` object for testing purposes.
 */
var generateMessageDraft = function (_a) {
    var channel_cid = _a.channel_cid, customMsgDraft = __rest(_a, ["channel_cid"]);
    return (__assign({ channel_cid: channel_cid, created_at: new Date().toISOString(), message: generateMessage() }, customMsgDraft));
};
exports.generateMessageDraft = generateMessageDraft;
