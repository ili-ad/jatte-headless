"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIntroMessage = exports.makeIntroMessage = exports.CUSTOM_MESSAGE_TYPE = void 0;
exports.CUSTOM_MESSAGE_TYPE = {
    date: 'message.date',
    intro: 'channel.intro',
};
var makeIntroMessage = function () { return ({
    customType: exports.CUSTOM_MESSAGE_TYPE.intro,
    id: Math.random().toString(36).slice(2),
}); };
exports.makeIntroMessage = makeIntroMessage;
var isIntroMessage = function (msg) {
    return typeof msg === 'object' && msg !== null && msg.customType === exports.CUSTOM_MESSAGE_TYPE.intro;
};
exports.isIntroMessage = isIntroMessage;
