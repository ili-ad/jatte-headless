"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCreateTypingContext = void 0;
var react_1 = require("react");
var useCreateTypingContext = function (value) {
    var typing = value.typing;
    var typingValue = Object.keys(typing || {}).join();
    var typingContext = (0, react_1.useMemo)(function () { return ({
        typing: typing,
    }); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typingValue]);
    return typingContext;
};
exports.useCreateTypingContext = useCreateTypingContext;
