"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollToBottomOnNewMessage = void 0;
var react_1 = require("react");
var useScrollToBottomOnNewMessage = function (_a) {
    var messages = _a.messages, scrollToBottom = _a.scrollToBottom, scrollToLatestMessageOnFocus = _a.scrollToLatestMessageOnFocus;
    var _b = (0, react_1.useState)(false), newMessagesReceivedInBackground = _b[0], setNewMessagesReceivedInBackground = _b[1];
    var scrollToBottomIfConfigured = (0, react_1.useRef)(undefined);
    scrollToBottomIfConfigured.current = function (event) {
        if (!scrollToLatestMessageOnFocus ||
            !newMessagesReceivedInBackground ||
            event.target !== window) {
            return;
        }
        setTimeout(scrollToBottom, 100);
    };
    (0, react_1.useEffect)(function () {
        setNewMessagesReceivedInBackground(true);
    }, [messages]);
    (0, react_1.useEffect)(function () {
        var handleFocus = function (event) {
            var _a;
            (_a = scrollToBottomIfConfigured.current) === null || _a === void 0 ? void 0 : _a.call(scrollToBottomIfConfigured, event);
        };
        var handleBlur = function () {
            setNewMessagesReceivedInBackground(false);
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', handleFocus);
            window.addEventListener('blur', handleBlur);
        }
        return function () {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);
};
exports.useScrollToBottomOnNewMessage = useScrollToBottomOnNewMessage;
