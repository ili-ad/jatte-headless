"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditMessageHandler = void 0;
var ChatContext_1 = require("../../../context/ChatContext");
var useEditMessageHandler = function (doUpdateMessageRequest) {
    var _a = (0, ChatContext_1.useChatContext)('useEditMessageHandler'), channel = _a.channel, client = _a.client;
    return function (updatedMessage, options) {
        if (doUpdateMessageRequest && channel) {
            return Promise.resolve(doUpdateMessageRequest(channel.cid, updatedMessage, options));
        }
        return Promise.resolve(undefined);
    };
};
exports.useEditMessageHandler = useEditMessageHandler;
