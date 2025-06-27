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
exports.useMessageListElements = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useMessageListElements` hook.
 * It simply calls the provided `renderMessages` function with the given
 * messages and returns its result.
 */
var useMessageListElements = function (props) {
    var enrichedMessages = props.enrichedMessages, internalMessageProps = props.internalMessageProps, renderMessages = props.renderMessages, threadList = props.threadList;
    var elements = (0, react_1.useMemo)(function () {
        return renderMessages({
            messages: enrichedMessages,
            sharedMessageProps: __assign(__assign({}, internalMessageProps), { threadList: threadList }),
        });
    }, [enrichedMessages, renderMessages, internalMessageProps, threadList]);
    return elements;
};
exports.useMessageListElements = useMessageListElements;
exports.default = exports.useMessageListElements;
