"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMentionsHandler = void 0;
function createEventHandler(fn, message) {
    return function (event) {
        var _a;
        if (typeof fn !== 'function' || !((_a = message === null || message === void 0 ? void 0 : message.mentioned_users) === null || _a === void 0 ? void 0 : _a.length)) {
            return;
        }
        fn(event, message.mentioned_users);
    };
}
var useMentionsHandler = function (message, customMentionHandler) {
    var onMentionsClick = (customMentionHandler === null || customMentionHandler === void 0 ? void 0 : customMentionHandler.onMentionsClick) || (function () { return null; });
    var onMentionsHover = (customMentionHandler === null || customMentionHandler === void 0 ? void 0 : customMentionHandler.onMentionsHover) || (function () { return null; });
    return {
        onMentionsClick: createEventHandler(onMentionsClick, message),
        onMentionsHover: createEventHandler(onMentionsHover, message),
    };
};
exports.useMentionsHandler = useMentionsHandler;
