"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thread = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var LegacyThreadContext_1 = require("./LegacyThreadContext");
var Message_1 = require("../Message");
var MessageInput_1 = require("../MessageInput");
var MessageList_1 = require("../MessageList");
var ThreadHeader_1 = require("./ThreadHeader");
var ThreadHead_1 = require("../Thread/ThreadHead");
var context_1 = require("../../context");
var Threads_1 = require("../Threads");
var store_1 = require("../../store");
/**
 * The Thread component renders a parent Message with a list of replies
 */
var Thread = function (props) {
    var _a;
    var _b = (0, context_1.useChannelStateContext)('Thread'), channel = _b.channel, channelConfig = _b.channelConfig, thread = _b.thread;
    var threadInstance = (0, Threads_1.useThreadContext)();
    if (!thread && !threadInstance)
        return null;
    if ((channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.replies) === false)
        return null;
    // the wrapper ensures a key variable is set and the component recreates on thread switch
    return (
    // FIXME: TS is having trouble here as at least one of the two would always be defined
    <ThreadInner {...props} key={"thread-".concat((_a = (thread !== null && thread !== void 0 ? thread : threadInstance)) === null || _a === void 0 ? void 0 : _a.id, "-").concat(channel === null || channel === void 0 ? void 0 : channel.cid)}/>);
};
exports.Thread = Thread;
var selector = function (nextValue) { return ({
    isLoadingNext: nextValue.pagination.isLoadingNext,
    isLoadingPrev: nextValue.pagination.isLoadingPrev,
    parentMessage: nextValue.parentMessage,
    replies: nextValue.replies,
}); };
var ThreadInner = function (props) {
    var _a, _b, _c;
    var additionalMessageInputProps = props.additionalMessageInputProps, additionalMessageListProps = props.additionalMessageListProps, additionalParentMessageProps = props.additionalParentMessageProps, additionalVirtualizedMessageListProps = props.additionalVirtualizedMessageListProps, _d = props.autoFocus, autoFocus = _d === void 0 ? true : _d, _e = props.enableDateSeparator, enableDateSeparator = _e === void 0 ? false : _e, PropInput = props.Input, PropMessage = props.Message, _f = props.messageActions, messageActions = _f === void 0 ? Object.keys(Message_1.MESSAGE_ACTIONS) : _f, virtualized = props.virtualized;
    var threadInstance = (0, Threads_1.useThreadContext)();
    var _g = (0, context_1.useChannelStateContext)('Thread'), thread = _g.thread, threadHasMore = _g.threadHasMore, threadLoadingMore = _g.threadLoadingMore, _h = _g.threadMessages, threadMessages = _h === void 0 ? [] : _h, threadSuppressAutoscroll = _g.threadSuppressAutoscroll;
    var _j = (0, context_1.useChannelActionContext)('Thread'), closeThread = _j.closeThread, loadMoreThread = _j.loadMoreThread;
    var customClasses = (0, context_1.useChatContext)('Thread').customClasses;
    var _k = (0, context_1.useComponentContext)('Thread'), ContextMessage = _k.Message, _l = _k.ThreadHead, ThreadHead = _l === void 0 ? ThreadHead_1.ThreadHead : _l, _m = _k.ThreadHeader, ThreadHeader = _m === void 0 ? ThreadHeader_1.ThreadHeader : _m, ContextInput = _k.ThreadInput, VirtualMessage = _k.VirtualMessage;
    var _o = (_a = (0, store_1.useStateStore)(threadInstance === null || threadInstance === void 0 ? void 0 : threadInstance.state, selector)) !== null && _a !== void 0 ? _a : {}, isLoadingNext = _o.isLoadingNext, isLoadingPrev = _o.isLoadingPrev, parentMessage = _o.parentMessage, replies = _o.replies;
    var ThreadInput = (_c = (_b = PropInput !== null && PropInput !== void 0 ? PropInput : additionalMessageInputProps === null || additionalMessageInputProps === void 0 ? void 0 : additionalMessageInputProps.Input) !== null && _b !== void 0 ? _b : ContextInput) !== null && _c !== void 0 ? _c : MessageInput_1.MessageInputFlat;
    var ThreadMessage = PropMessage || (additionalMessageListProps === null || additionalMessageListProps === void 0 ? void 0 : additionalMessageListProps.Message);
    var FallbackMessage = virtualized && VirtualMessage ? VirtualMessage : ContextMessage;
    var MessageUIComponent = ThreadMessage || FallbackMessage;
    var ThreadMessageList = virtualized ? MessageList_1.VirtualizedMessageList : MessageList_1.MessageList;
    (0, react_1.useEffect)(function () {
        var _a;
        if (threadInstance)
            return;
        if (((_a = thread === null || thread === void 0 ? void 0 : thread.reply_count) !== null && _a !== void 0 ? _a : 0) > 0) {
            // FIXME: integrators can customize channel query options but cannot customize channel.getReplies() options
            loadMoreThread();
        }
    }, [thread, loadMoreThread, threadInstance]);
    var threadProps = threadInstance
        ? {
            loadingMore: isLoadingPrev,
            loadingMoreNewer: isLoadingNext,
            loadMore: threadInstance.loadPrevPage,
            loadMoreNewer: threadInstance.loadNextPage,
            messages: replies,
        }
        : {
            hasMore: threadHasMore,
            loadingMore: threadLoadingMore,
            loadMore: loadMoreThread,
            messages: threadMessages,
        };
    var messageAsThread = thread !== null && thread !== void 0 ? thread : parentMessage;
    if (!messageAsThread)
        return null;
    var threadClass = (customClasses === null || customClasses === void 0 ? void 0 : customClasses.thread) ||
        (0, clsx_1.default)('str-chat__thread-container str-chat__thread', {
            'str-chat__thread--virtualized': virtualized,
        });
    var head = (<ThreadHead key={messageAsThread.id} message={messageAsThread} Message={MessageUIComponent} {...additionalParentMessageProps}/>);
    return (
    // Thread component needs a context which we can use for message composer
    <LegacyThreadContext_1.LegacyThreadContext.Provider value={{
            legacyThread: thread !== null && thread !== void 0 ? thread : undefined,
        }}>
      <div className={threadClass}>
        <ThreadHeader closeThread={closeThread} thread={messageAsThread}/>
        <ThreadMessageList disableDateSeparator={!enableDateSeparator} head={head} Message={MessageUIComponent} messageActions={messageActions} suppressAutoscroll={threadSuppressAutoscroll} threadList {...threadProps} {...(virtualized
        ? additionalVirtualizedMessageListProps
        : additionalMessageListProps)}/>
        <MessageInput_1.MessageInput focus={autoFocus} Input={ThreadInput} isThreadInput parent={thread !== null && thread !== void 0 ? thread : parentMessage} {...additionalMessageInputProps}/>
      </div>
    </LegacyThreadContext_1.LegacyThreadContext.Provider>);
};
