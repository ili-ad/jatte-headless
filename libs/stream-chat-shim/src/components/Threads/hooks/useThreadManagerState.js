"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThreadManagerState = void 0;
var context_1 = require("../../../context");
var store_1 = require("../../../store");
var useThreadManagerState = function (selector) {
    var client = (0, context_1.useChatContext)().client;
    return (0, store_1.useStateStore)(client.threads.state, selector);
};
exports.useThreadManagerState = useThreadManagerState;
