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
var useLastReadData = function () { return ({}); }; // temporary shim
var getLastReceived = function () { return null; };
var useChatContext = function () { return ({ client: {}, customClasses: {} }); };
var useComponentContext = function () { return ({}); };
var useMessageListElements = function (props) {
    var channelUnreadUiState = props.channelUnreadUiState, enrichedMessages = props.enrichedMessages, internalMessageProps = props.internalMessageProps, messageGroupStyles = props.messageGroupStyles, read = props.read, renderMessages = props.renderMessages, returnAllReadData = props.returnAllReadData, threadList = props.threadList;
    var _a = useChatContext('useMessageListElements'), client = _a.client, customClasses = _a.customClasses;
    var components = useComponentContext('useMessageListElements');
    // get the readData, but only for messages submitted by the user themselves
    var readData = useLastReadData({
        messages: enrichedMessages,
        read: read,
        returnAllReadData: returnAllReadData,
        userID: client.userID,
    });
    var lastReceivedMessageId = (0, react_1.useMemo)(function () { return getLastReceived(enrichedMessages); }, [enrichedMessages]);
    var elements = (0, react_1.useMemo)(function () {
        return renderMessages({
            channelUnreadUiState: channelUnreadUiState,
            components: components,
            customClasses: customClasses,
            lastReceivedMessageId: lastReceivedMessageId,
            messageGroupStyles: messageGroupStyles,
            messages: enrichedMessages,
            readData: readData,
            sharedMessageProps: __assign(__assign({}, internalMessageProps), { threadList: threadList }),
        });
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        enrichedMessages,
        internalMessageProps,
        lastReceivedMessageId,
        messageGroupStyles,
        channelUnreadUiState,
        readData,
        renderMessages,
        threadList,
    ]);
    return elements;
};
exports.useMessageListElements = useMessageListElements;
