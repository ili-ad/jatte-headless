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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamedMessageText = void 0;
var react_1 = require("react");
var MessageText = (function () { return null; });
var context_1 = require("../../context");
var hooks_1 = require("./hooks");
var StreamedMessageText = function (props) {
    var messageFromProps = props.message, renderingLetterCount = props.renderingLetterCount, renderText = props.renderText, streamingLetterIntervalMs = props.streamingLetterIntervalMs;
    var messageFromContext = (0, context_1.useMessageContext)('StreamedMessageText').message;
    var message = messageFromProps || messageFromContext;
    var _a = message.text, text = _a === void 0 ? '' : _a;
    var streamedMessageText = (0, hooks_1.useMessageTextStreaming)({
        renderingLetterCount: renderingLetterCount,
        streamingLetterIntervalMs: streamingLetterIntervalMs,
        text: text,
    }).streamedMessageText;
    return (<MessageText message={__assign(__assign({}, message), { text: streamedMessageText })} renderText={renderText}/>);
};
exports.StreamedMessageText = StreamedMessageText;
