"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadList = exports.useThreadList = void 0;
var react_1 = require("react");
var react_virtuoso_1 = require("react-virtuoso");
var ThreadListItem_1 = require("./ThreadListItem");
var ThreadListEmptyPlaceholder_1 = require("./ThreadListEmptyPlaceholder");
var ThreadListUnseenThreadsBanner_1 = require("./ThreadListUnseenThreadsBanner");
var ThreadListLoadingIndicator_1 = require("./ThreadListLoadingIndicator");
var context_1 = require("../../../context");
var store_1 = require("../../../store");
var selector = function (nextValue) { return ({ threads: nextValue.threads }); };
var computeItemKey = function (_, item) { return item.id; };
var useThreadList = function () {
    var client = (0, context_1.useChatContext)().client;
    (0, react_1.useEffect)(function () {
        var handleVisibilityChange = function () {
            if (document.visibilityState === 'visible') {
                /* TODO backend-wire-up: client.threads.activate */
            }
            if (document.visibilityState === 'hidden') {
                /* TODO backend-wire-up: client.threads.deactivate */
            }
        };
        handleVisibilityChange();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return function () {
            /* TODO backend-wire-up: client.threads.deactivate */
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [client]);
};
exports.useThreadList = useThreadList;
var ThreadList = function (_a) {
    var virtuosoProps = _a.virtuosoProps;
    var client = (0, context_1.useChatContext)().client;
    var _b = (0, context_1.useComponentContext)(), _c = _b.ThreadListEmptyPlaceholder, ThreadListEmptyPlaceholder = _c === void 0 ? ThreadListEmptyPlaceholder_1.ThreadListEmptyPlaceholder : _c, _d = _b.ThreadListItem, ThreadListItem = _d === void 0 ? ThreadListItem_1.ThreadListItem : _d, _e = _b.ThreadListLoadingIndicator, ThreadListLoadingIndicator = _e === void 0 ? ThreadListLoadingIndicator_1.ThreadListLoadingIndicator : _e, _f = _b.ThreadListUnseenThreadsBanner, ThreadListUnseenThreadsBanner = _f === void 0 ? ThreadListUnseenThreadsBanner_1.ThreadListUnseenThreadsBanner : _f;
    var threads = (0, store_1.useStateStore)(client.threads.state, selector).threads;
    (0, exports.useThreadList)();
    return (<div className='str-chat__thread-list-container'>
      {/* TODO: allow re-load on stale ThreadManager state */}
      <ThreadListUnseenThreadsBanner />
      <react_virtuoso_1.Virtuoso atBottomStateChange={function (atBottom) {
            return atBottom && /* TODO backend-wire-up: client.threads.loadNextPage */ null;
        }} className='str-chat__thread-list' components={{
            EmptyPlaceholder: ThreadListEmptyPlaceholder,
            Footer: ThreadListLoadingIndicator,
        }} computeItemKey={computeItemKey} data={threads} itemContent={function (_, thread) { return <ThreadListItem thread={thread}/>; }} 
    // TODO: handle visibility (for a button that scrolls to the unread thread)
    // itemsRendered={(items) => console.log({ items })}
    {...virtuosoProps}/>
    </div>);
};
exports.ThreadList = ThreadList;
