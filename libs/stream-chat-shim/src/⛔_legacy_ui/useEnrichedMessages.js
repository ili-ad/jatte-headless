"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnrichedMessages = void 0;
var react_1 = require("react");
var useEnrichedMessages = function (args) {
    var messages = args.messages;
    var messageGroupStyles = (0, react_1.useMemo)(function () { return ({}); }, [messages]);
    return { messageGroupStyles: messageGroupStyles, messages: messages };
};
exports.useEnrichedMessages = useEnrichedMessages;
