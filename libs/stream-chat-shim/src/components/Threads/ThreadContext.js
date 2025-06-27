"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadProvider = exports.useThreadContext = exports.ThreadContext = void 0;
var react_1 = require("react");
var components_1 = require("../../components");
exports.ThreadContext = (0, react_1.createContext)(undefined);
var useThreadContext = function () { return (0, react_1.useContext)(exports.ThreadContext); };
exports.useThreadContext = useThreadContext;
var ThreadProvider = function (_a) {
    var children = _a.children, thread = _a.thread;
    return (<exports.ThreadContext.Provider value={thread}>
    <components_1.Channel channel={thread === null || thread === void 0 ? void 0 : thread.channel}>{children}</components_1.Channel>
  </exports.ThreadContext.Provider>);
};
exports.ThreadProvider = ThreadProvider;
