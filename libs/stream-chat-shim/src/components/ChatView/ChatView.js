"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useActiveThread = exports.useThreadsViewContext = exports.ChatView = void 0;
var react_1 = require("react");
var Threads_1 = require("../Threads");
var icons_1 = require("../Threads/icons");
var UnreadCountBadge_1 = require("../Threads/UnreadCountBadge");
var context_1 = require("../../context");
var store_1 = require("../../store");
var clsx_1 = require("clsx");
var ChatViewContext = (0, react_1.createContext)({
    activeChatView: 'channels',
    setActiveChatView: function () { return undefined; },
});
var ChatView = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)('channels'), activeChatView = _b[0], setActiveChatView = _b[1];
    var theme = (0, context_1.useChatContext)().theme;
    var value = (0, react_1.useMemo)(function () { return ({ activeChatView: activeChatView, setActiveChatView: setActiveChatView }); }, [activeChatView]);
    return (<ChatViewContext.Provider value={value}>
      <div className={(0, clsx_1.default)('str-chat', theme, 'str-chat__chat-view')}>{children}</div>
    </ChatViewContext.Provider>);
};
exports.ChatView = ChatView;
var ChannelsView = function (_a) {
    var children = _a.children;
    var activeChatView = (0, react_1.useContext)(ChatViewContext).activeChatView;
    if (activeChatView !== 'channels')
        return null;
    return <div className='str-chat__chat-view__channels'>{children}</div>;
};
var ThreadsViewContext = (0, react_1.createContext)({
    activeThread: undefined,
    setActiveThread: function () { return undefined; },
});
var useThreadsViewContext = function () { return (0, react_1.useContext)(ThreadsViewContext); };
exports.useThreadsViewContext = useThreadsViewContext;
var ThreadsView = function (_a) {
    var children = _a.children;
    var activeChatView = (0, react_1.useContext)(ChatViewContext).activeChatView;
    var _b = (0, react_1.useState)(undefined), activeThread = _b[0], setActiveThread = _b[1];
    var value = (0, react_1.useMemo)(function () { return ({ activeThread: activeThread, setActiveThread: setActiveThread }); }, [activeThread]);
    if (activeChatView !== 'threads')
        return null;
    return (<ThreadsViewContext.Provider value={value}>
      <div className='str-chat__chat-view__threads'>{children}</div>
    </ThreadsViewContext.Provider>);
};
// thread business logic that's impossible to keep within client but encapsulated for ease of use
var useActiveThread = function (_a) {
    var activeThread = _a.activeThread;
    (0, react_1.useEffect)(function () {
        if (!activeThread)
            return;
        var handleVisibilityChange = function () {
            if (document.visibilityState === 'visible' && document.hasFocus()) {
                activeThread.activate();
            }
            if (document.visibilityState === 'hidden' || !document.hasFocus()) {
                activeThread.deactivate();
            }
        };
        handleVisibilityChange();
        window.addEventListener('focus', handleVisibilityChange);
        window.addEventListener('blur', handleVisibilityChange);
        return function () {
            activeThread.deactivate();
            window.addEventListener('blur', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [activeThread]);
};
exports.useActiveThread = useActiveThread;
// ThreadList under View.Threads context, will access setting function and on item click will set activeThread
// which can be accessed for the ease of use by ThreadAdapter which forwards it to required ThreadProvider
// ThreadList can easily live without this context and click handler can be overriden, ThreadAdapter is then no longer needed
/**
 * // this setup still works
 * const MyCustomComponent = () => {
 *  const [activeThread, setActiveThread] = useState();
 *
 *  return <>
 *    // simplified
 *    <ThreadList onItemPointerDown={setActiveThread} />
 *    <ThreadProvider thread={activeThread}>
 *      <Thread />
 *    </ThreadProvider>
 *  </>
 * }
 *
 */
var ThreadAdapter = function (_a) {
    var children = _a.children;
    var activeThread = (0, exports.useThreadsViewContext)().activeThread;
    (0, exports.useActiveThread)({ activeThread: activeThread });
    return <Threads_1.ThreadProvider thread={activeThread}>{children}</Threads_1.ThreadProvider>;
};
var selector = function (_a) {
    var unreadThreadCount = _a.unreadThreadCount;
    return ({
        unreadThreadCount: unreadThreadCount,
    });
};
var ChatViewSelector = function () {
    var client = (0, context_1.useChatContext)().client;
    var unreadThreadCount = (0, store_1.useStateStore)(
    /* TODO backend-wire-up: client.threads.state */,
    selector
    ).unreadThreadCount;
    var _a = (0, react_1.useContext)(ChatViewContext), activeChatView = _a.activeChatView, setActiveChatView = _a.setActiveChatView;
    return (<div className='str-chat__chat-view__selector'>
      <button aria-selected={activeChatView === 'channels'} className='str-chat__chat-view__selector-button' onPointerDown={function () { return setActiveChatView('channels'); }} role='tab'>
        <icons_1.Icon.MessageBubbleEmpty />
        <div className='str-chat__chat-view__selector-button-text'>Channels</div>
      </button>
      <button aria-selected={activeChatView === 'threads'} className='str-chat__chat-view__selector-button' onPointerDown={function () { return setActiveChatView('threads'); }} role='tab'>
        <UnreadCountBadge_1.UnreadCountBadge count={unreadThreadCount} position='top-right'>
          <icons_1.Icon.MessageBubble />
        </UnreadCountBadge_1.UnreadCountBadge>
        <div className='str-chat__chat-view__selector-button-text'>Threads</div>
      </button>
    </div>);
};
exports.ChatView.Channels = ChannelsView;
exports.ChatView.Threads = ThreadsView;
exports.ChatView.ThreadAdapter = ThreadAdapter;
exports.ChatView.Selector = ChatViewSelector;
