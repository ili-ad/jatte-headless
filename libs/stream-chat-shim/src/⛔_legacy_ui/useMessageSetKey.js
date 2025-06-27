"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageSetKey = void 0;
var react_1 = require("react");
/**
 * Logic to update the key of the virtuoso component when the list jumps to a new location.
 */
var useMessageSetKey = function (_a) {
    var messages = _a.messages;
    var _b = (0, react_1.useState)(+new Date()), messageSetKey = _b[0], setMessageSetKey = _b[1];
    var firstMessageId = (0, react_1.useRef)(undefined);
    (0, react_1.useEffect)(function () {
        var _a;
        var continuousSet = messages === null || messages === void 0 ? void 0 : messages.find(function (message) { return message.id === firstMessageId.current; });
        if (!continuousSet) {
            setMessageSetKey(+new Date());
        }
        firstMessageId.current = (_a = messages === null || messages === void 0 ? void 0 : messages[0]) === null || _a === void 0 ? void 0 : _a.id;
    }, [messages]);
    return {
        messageSetKey: messageSetKey,
    };
};
exports.useMessageSetKey = useMessageSetKey;
