"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatView = exports.useActiveThread = exports.useThreadsViewContext = void 0;
var react_1 = require("react");
var ThreadsViewContext = (0, react_1.createContext)({
    activeThread: undefined,
    setActiveThread: function () { },
});
var useThreadsViewContext = function () { return (0, react_1.useContext)(ThreadsViewContext); };
exports.useThreadsViewContext = useThreadsViewContext;
var useActiveThread = function (_a) {
    var activeThread = _a.activeThread;
    (0, react_1.useEffect)(function () {
        // TODO: implement thread activation logic
    }, [activeThread]);
};
exports.useActiveThread = useActiveThread;
var ChatView = function (_a) {
    var children = _a.children;
    return <div data-testid="chat-view">{children}</div>;
};
exports.ChatView = ChatView;
exports.ChatView.Channels = function (_a) {
    var children = _a.children;
    return (<div data-testid="chat-view-channels">{children}</div>);
};
exports.ChatView.Threads = function (_a) {
    var children = _a.children;
    return (<div data-testid="chat-view-threads">{children}</div>);
};
exports.ChatView.ThreadAdapter = function (_a) {
    var children = _a.children;
    return (<div data-testid="chat-view-thread-adapter">{children}</div>);
};
exports.ChatView.Selector = function () { return <div data-testid="chat-view-selector"/>; };
exports.default = exports.ChatView;
