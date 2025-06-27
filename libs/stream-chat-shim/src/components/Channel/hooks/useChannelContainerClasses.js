"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelContainerClasses = exports.getChatContainerClass = exports.useImageFlagEmojisOnWindowsClass = void 0;
var ChatContext_1 = require("../../../context/ChatContext");
var useImageFlagEmojisOnWindowsClass = function () {
    var useImageFlagEmojisOnWindows = (0, ChatContext_1.useChatContext)('Channel').useImageFlagEmojisOnWindows;
    return useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
        ? 'str-chat--windows-flags'
        : '';
};
exports.useImageFlagEmojisOnWindowsClass = useImageFlagEmojisOnWindowsClass;
var getChatContainerClass = function (customClass) {
    return customClass !== null && customClass !== void 0 ? customClass : 'str-chat__container';
};
exports.getChatContainerClass = getChatContainerClass;
var useChannelContainerClasses = function (_a) {
    var _b, _c;
    var customClasses = _a.customClasses;
    var windowsEmojiClass = (0, exports.useImageFlagEmojisOnWindowsClass)();
    return {
        channelClass: (_b = customClasses === null || customClasses === void 0 ? void 0 : customClasses.channel) !== null && _b !== void 0 ? _b : 'str-chat__channel',
        chatClass: (_c = customClasses === null || customClasses === void 0 ? void 0 : customClasses.chat) !== null && _c !== void 0 ? _c : 'str-chat',
        chatContainerClass: (0, exports.getChatContainerClass)(customClasses === null || customClasses === void 0 ? void 0 : customClasses.chatContainer),
        windowsEmojiClass: windowsEmojiClass,
    };
};
exports.useChannelContainerClasses = useChannelContainerClasses;
