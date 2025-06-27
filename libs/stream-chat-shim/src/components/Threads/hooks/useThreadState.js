"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThreadState = void 0;
var ThreadList_1 = require("../ThreadList");
var ThreadContext_1 = require("../ThreadContext");
var store_1 = require("../../../store/");
/**
 * @description returns thread state, prioritizes `ThreadListItemContext` falls back to `ThreadContext` if not former is not present
 */
var useThreadState = function (selector) {
    var _a;
    var listItemThread = (0, ThreadList_1.useThreadListItemContext)();
    var thread = (0, ThreadContext_1.useThreadContext)();
    return (0, store_1.useStateStore)((_a = listItemThread === null || listItemThread === void 0 ? void 0 : listItemThread.state) !== null && _a !== void 0 ? _a : thread === null || thread === void 0 ? void 0 : thread.state, selector);
};
exports.useThreadState = useThreadState;
