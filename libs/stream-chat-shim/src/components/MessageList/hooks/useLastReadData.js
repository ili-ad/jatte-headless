"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLastReadData = void 0;
var react_1 = require("react");
var utils_1 = require("../utils");
var utils_2 = require("../utils");
var useLastReadData = function (props) {
    var messages = props.messages, read = props.read, returnAllReadData = props.returnAllReadData, userID = props.userID;
    return (0, react_1.useMemo)(function () {
        var ownLocalMessages = messages.filter(function (msg) { var _a; return (0, utils_1.isLocalMessage)(msg) && ((_a = msg.user) === null || _a === void 0 ? void 0 : _a.id) === userID; });
        return (0, utils_2.getReadStates)(ownLocalMessages, read, returnAllReadData);
    }, [messages, read, returnAllReadData, userID]);
};
exports.useLastReadData = useLastReadData;
