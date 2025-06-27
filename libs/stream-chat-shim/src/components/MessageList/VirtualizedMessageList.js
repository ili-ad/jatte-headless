"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualizedMessageList = VirtualizedMessageList;
var react_1 = require("react");
var react_virtuoso_1 = require("react-virtuoso");
var DefaultGiphyPreviewMessage = (function () { return null; });
var useLastReadData = function (_) { return ({}); };
// import {
//   useGiphyPreview,
//   useMessageSetKey,
//   useNewMessageNotification,
//   usePrependedMessagesCount,
//   useScrollToBottomOnNewMessage,
//   useShouldForceScrollToBottom,
//   useUnreadMessagesNotificationVirtualized,
var useGiphyPreview = function (_) { return ({ giphyPreviewMessage: undefined, setGiphyPreviewMessage: function () { } }); };
var useMessageSetKey = function (_) { return ({ messageSetKey: undefined }); };
var useNewMessageNotification = function (_msgs, _id, _hasMore) { return ({
    atBottom: { current: false },
    isMessageListScrolledToBottom: false,
    newMessagesNotification: false,
    setIsMessageListScrolledToBottom: function () { },
    setNewMessagesNotification: function () { },
}); };
var usePrependedMessagesCount = function (_msgs, _flag) { return 0; };
var useScrollToBottomOnNewMessage = function (_) { };
var useShouldForceScrollToBottom = function (_, _2) { return function () { return false; }; };
var useUnreadMessagesNotificationVirtualized = function (_) { return ({ show: false, toggleShowUnreadMessagesNotification: function () { } }); };
var useMarkRead = function (_) { };
var DefaultMessageNotification = (function () { return null; });
var DefaultMessageListNotifications = (function () { return null; });
var DefaultMessageListMainPanel = (function () { return null; });
var getGroupStyles = function () {
    var _args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _args[_i] = arguments[_i];
    }
    return ({});
};
var getLastReceived = function () {
    var _args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _args[_i] = arguments[_i];
    }
    return null;
};
var processMessages = function () {
    var _args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _args[_i] = arguments[_i];
    }
    return [];
};
var Message_1 = require("../Message");
var UnreadMessagesNotification_1 = require("./UnreadMessagesNotification");
var VirtualizedMessageListComponents_1 = require("./VirtualizedMessageListComponents");
var MessageList_1 = require("../MessageList");
var DateSeparator_1 = require("../DateSeparator");
var EventComponent_1 = require("../EventComponent");
var DialogManagerProvider = function (_a) {
    var children = _a.children;
    return <>{children}</>;
};
var useChannelActionContext = function (_) { return ({}); };
var useChannelStateContext = function (_) { return ({}); };
var useChatContext = function (_) { return ({ client: { userID: undefined }, customClasses: {} }); };
var useComponentContext = function (_) { return ({}); };
var VirtualizedMessageListContextProvider = function (_a) {
    var children = _a.children;
    return <>{children}</>;
};
var limits_1 = require("../../constants/limits");
var useStableId = function () { return 'stable-id'; };
function captureResizeObserverExceededError(e) {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded') {
        e.stopImmediatePropagation();
    }
}
function useCaptureResizeObserverExceededError() {
    (0, react_1.useEffect)(function () {
        window.addEventListener('error', captureResizeObserverExceededError);
        return function () {
            window.removeEventListener('error', captureResizeObserverExceededError);
        };
    }, []);
}
function fractionalItemSize(element) {
    return element.getBoundingClientRect().height;
}
function findMessageIndex(messages, id) {
    return messages.findIndex(function (message) { return message.id === id; });
}
function calculateInitialTopMostItemIndex(messages, highlightedMessageId) {
    if (highlightedMessageId) {
        var index = findMessageIndex(messages, highlightedMessageId);
        if (index !== -1) {
            return { align: 'center', index: index };
        }
    }
    return messages.length - 1;
}
var VirtualizedMessageListWithContext = function (props) {
    var _a;
    var additionalMessageInputProps = props.additionalMessageInputProps, _b = props.additionalVirtuosoProps, additionalVirtuosoProps = _b === void 0 ? {} : _b, channel = props.channel, channelUnreadUiState = props.channelUnreadUiState, closeReactionSelectorOnClick = props.closeReactionSelectorOnClick, customMessageActions = props.customMessageActions, customMessageRenderer = props.customMessageRenderer, defaultItemHeight = props.defaultItemHeight, _c = props.disableDateSeparator, disableDateSeparator = _c === void 0 ? true : _c, formatDate = props.formatDate, groupStyles = props.groupStyles, hasMoreNewer = props.hasMoreNewer, head = props.head, _d = props.hideDeletedMessages, hideDeletedMessages = _d === void 0 ? false : _d, _e = props.hideNewMessageSeparator, hideNewMessageSeparator = _e === void 0 ? false : _e, highlightedMessageId = props.highlightedMessageId, jumpToLatestMessage = props.jumpToLatestMessage, loadingMore = props.loadingMore, loadMore = props.loadMore, loadMoreNewer = props.loadMoreNewer, maxTimeBetweenGroupedMessages = props.maxTimeBetweenGroupedMessages, MessageUIComponentFromProps = props.Message, messageActions = props.messageActions, _f = props.messageLimit, messageLimit = _f === void 0 ? limits_1.DEFAULT_NEXT_CHANNEL_PAGE_SIZE : _f, messages = props.messages, notifications = props.notifications, openThread = props.openThread, 
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    _g = props.overscan, 
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    overscan = _g === void 0 ? 0 : _g, reactionDetailsSort = props.reactionDetailsSort, read = props.read, _h = props.returnAllReadData, returnAllReadData = _h === void 0 ? false : _h, reviewProcessedMessage = props.reviewProcessedMessage, scrollSeekPlaceHolder = props.scrollSeekPlaceHolder, _j = props.scrollToLatestMessageOnFocus, scrollToLatestMessageOnFocus = _j === void 0 ? false : _j, _k = props.separateGiphyPreview, separateGiphyPreview = _k === void 0 ? false : _k, _l = props.shouldGroupByUser, shouldGroupByUser = _l === void 0 ? false : _l, showUnreadNotificationAlways = props.showUnreadNotificationAlways, sortReactionDetails = props.sortReactionDetails, sortReactions = props.sortReactions, _m = props.stickToBottomScrollBehavior, stickToBottomScrollBehavior = _m === void 0 ? 'smooth' : _m, suppressAutoscroll = props.suppressAutoscroll, threadList = props.threadList;
    var virtuosoComponentsFromProps = additionalVirtuosoProps.components, overridingVirtuosoProps = __rest(additionalVirtuosoProps, ["components"]);
    // Stops errors generated from react-virtuoso to bubble up
    // to Sentry or other tracking tools.
    useCaptureResizeObserverExceededError();
    var _o = useComponentContext('VirtualizedMessageList'), _p = _o.DateSeparator, DateSeparator = _p === void 0 ? DateSeparator_1.DateSeparator : _p, _q = _o.GiphyPreviewMessage, GiphyPreviewMessage = _q === void 0 ? DefaultGiphyPreviewMessage : _q, _r = _o.MessageListMainPanel, MessageListMainPanel = _r === void 0 ? DefaultMessageListMainPanel : _r, _s = _o.MessageListNotifications, MessageListNotifications = _s === void 0 ? DefaultMessageListNotifications : _s, _t = _o.MessageNotification, MessageNotification = _t === void 0 ? DefaultMessageNotification : _t, _u = _o.MessageSystem, MessageSystem = _u === void 0 ? EventComponent_1.EventComponent : _u, TypingIndicator = _o.TypingIndicator, _v = _o.UnreadMessagesNotification, UnreadMessagesNotification = _v === void 0 ? UnreadMessagesNotification_1.UnreadMessagesNotification : _v, _w = _o.UnreadMessagesSeparator, UnreadMessagesSeparator = _w === void 0 ? MessageList_1.UnreadMessagesSeparator : _w, _x = _o.VirtualMessage, MessageUIComponentFromContext = _x === void 0 ? Message_1.MessageSimple : _x;
    var MessageUIComponent = MessageUIComponentFromProps || MessageUIComponentFromContext;
    var _y = useChatContext('VirtualizedMessageList'), client = _y.client, customClasses = _y.customClasses;
    var virtuoso = (0, react_1.useRef)(null);
    var lastRead = (0, react_1.useMemo)(function () { var _a; return (_a = channel.lastRead) === null || _a === void 0 ? void 0 : _a.call(channel); }, [channel]);
    var _z = useUnreadMessagesNotificationVirtualized({
        lastRead: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.last_read,
        showAlways: !!showUnreadNotificationAlways,
        unreadCount: (_a = channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages) !== null && _a !== void 0 ? _a : 0,
    }), showUnreadMessagesNotification = _z.show, toggleShowUnreadMessagesNotification = _z.toggleShowUnreadMessagesNotification;
    var _0 = useGiphyPreview(separateGiphyPreview), giphyPreviewMessage = _0.giphyPreviewMessage, setGiphyPreviewMessage = _0.setGiphyPreviewMessage;
    var processedMessages = (0, react_1.useMemo)(function () {
        if (typeof messages === 'undefined') {
            return [];
        }
        if (disableDateSeparator &&
            !hideDeletedMessages &&
            hideNewMessageSeparator &&
            !separateGiphyPreview) {
            return messages;
        }
        return processMessages({
            enableDateSeparator: !disableDateSeparator,
            hideDeletedMessages: hideDeletedMessages,
            hideNewMessageSeparator: hideNewMessageSeparator,
            lastRead: lastRead,
            messages: messages,
            reviewProcessedMessage: reviewProcessedMessage,
            setGiphyPreviewMessage: setGiphyPreviewMessage,
            userId: client.userID || '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        disableDateSeparator,
        hideDeletedMessages,
        hideNewMessageSeparator,
        lastRead,
        messages,
        messages === null || messages === void 0 ? void 0 : messages.length,
        client.userID,
    ]);
    // get the mapping of own messages to array of users who read them
    var ownMessagesReadByOthers = useLastReadData({
        messages: processedMessages,
        read: read,
        returnAllReadData: returnAllReadData,
        userID: client.userID,
    });
    var lastReceivedMessageId = (0, react_1.useMemo)(function () { return getLastReceived(processedMessages); }, [processedMessages]);
    var groupStylesFn = groupStyles || getGroupStyles;
    var messageGroupStyles = (0, react_1.useMemo)(function () {
        return processedMessages.reduce(function (acc, message, i) {
            var style = groupStylesFn(message, processedMessages[i - 1], processedMessages[i + 1], !shouldGroupByUser, maxTimeBetweenGroupedMessages);
            if (style && message.id)
                acc[message.id] = style;
            return acc;
        }, {});
    }, 
    // processedMessages were incorrectly rebuilt with a new object identity at some point, hence the .length usage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        maxTimeBetweenGroupedMessages,
        processedMessages.length,
        shouldGroupByUser,
        groupStylesFn,
    ]);
    var _1 = useNewMessageNotification(processedMessages, client.userID, hasMoreNewer), atBottom = _1.atBottom, isMessageListScrolledToBottom = _1.isMessageListScrolledToBottom, newMessagesNotification = _1.newMessagesNotification, setIsMessageListScrolledToBottom = _1.setIsMessageListScrolledToBottom, setNewMessagesNotification = _1.setNewMessagesNotification;
    useMarkRead({
        isMessageListScrolledToBottom: isMessageListScrolledToBottom,
        messageListIsThread: !!threadList,
        wasMarkedUnread: !!(channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.first_unread_message_id),
    });
    var scrollToBottom = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!hasMoreNewer) return [3 /*break*/, 2];
                    return [4 /*yield*/, jumpToLatestMessage()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    if (virtuoso.current) {
                        virtuoso.current.scrollToIndex(processedMessages.length - 1);
                    }
                    setNewMessagesNotification(false);
                    return [2 /*return*/];
            }
        });
    }); }, [
        virtuoso,
        processedMessages,
        setNewMessagesNotification,
        // processedMessages were incorrectly rebuilt with a new object identity at some point, hence the .length usage
        processedMessages.length,
        hasMoreNewer,
        jumpToLatestMessage,
    ]);
    useScrollToBottomOnNewMessage({
        messages: messages,
        scrollToBottom: scrollToBottom,
        scrollToLatestMessageOnFocus: scrollToLatestMessageOnFocus,
    });
    var numItemsPrepended = usePrependedMessagesCount(processedMessages, !disableDateSeparator);
    var messageSetKey = useMessageSetKey({ messages: messages }).messageSetKey;
    var shouldForceScrollToBottom = useShouldForceScrollToBottom(processedMessages, client.userID);
    var handleItemsRendered = (0, react_1.useMemo)(function () {
        return (0, VirtualizedMessageListComponents_1.makeItemsRenderedHandler)([toggleShowUnreadMessagesNotification], processedMessages);
    }, [processedMessages, toggleShowUnreadMessagesNotification]);
    var followOutput = function (isAtBottom) {
        if (hasMoreNewer || suppressAutoscroll) {
            return false;
        }
        if (shouldForceScrollToBottom()) {
            return isAtBottom ? stickToBottomScrollBehavior : 'auto';
        }
        // a message from another user has been received - don't scroll to bottom unless already there
        return isAtBottom ? stickToBottomScrollBehavior : false;
    };
    var computeItemKey = (0, react_1.useCallback)(function (index, _, _a) {
        var numItemsPrepended = _a.numItemsPrepended, processedMessages = _a.processedMessages;
        return processedMessages[(0, VirtualizedMessageListComponents_1.calculateItemIndex)(index, numItemsPrepended)].id;
    }, []);
    var atBottomStateChange = function (isAtBottom) {
        atBottom.current = isAtBottom;
        setIsMessageListScrolledToBottom(isAtBottom);
        if (isAtBottom) {
            loadMoreNewer === null || loadMoreNewer === void 0 ? void 0 : loadMoreNewer(messageLimit);
            setNewMessagesNotification === null || setNewMessagesNotification === void 0 ? void 0 : setNewMessagesNotification(false);
        }
    };
    var atTopStateChange = function (isAtTop) {
        if (isAtTop) {
            loadMore === null || loadMore === void 0 ? void 0 : loadMore(messageLimit);
        }
    };
    (0, react_1.useEffect)(function () {
        var scrollTimeout;
        if (highlightedMessageId) {
            var index_1 = findMessageIndex(processedMessages, highlightedMessageId);
            if (index_1 !== -1) {
                scrollTimeout = setTimeout(function () {
                    var _a;
                    (_a = virtuoso.current) === null || _a === void 0 ? void 0 : _a.scrollToIndex({ align: 'center', index: index_1 });
                }, 0);
            }
        }
        return function () {
            clearTimeout(scrollTimeout);
        };
    }, [highlightedMessageId, processedMessages]);
    var id = useStableId();
    if (!processedMessages)
        return null;
    var dialogManagerId = threadList
        ? "virtualized-message-list-dialog-manager-thread-".concat(id)
        : "virtualized-message-list-dialog-manager-".concat(id);
    return (<VirtualizedMessageListContextProvider value={{ scrollToBottom: scrollToBottom }}>
      <MessageListMainPanel>
        <DialogManagerProvider id={dialogManagerId}>
          {!threadList && showUnreadMessagesNotification && (<UnreadMessagesNotification unreadCount={channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages}/>)}
          <div className={(customClasses === null || customClasses === void 0 ? void 0 : customClasses.virtualizedMessageList) || 'str-chat__virtual-list'}>
            <react_virtuoso_1.Virtuoso atBottomStateChange={atBottomStateChange} atBottomThreshold={100} atTopStateChange={atTopStateChange} atTopThreshold={100} className='str-chat__message-list-scroll' components={__assign({ EmptyPlaceholder: VirtualizedMessageListComponents_1.EmptyPlaceholder, Header: VirtualizedMessageListComponents_1.Header, Item: VirtualizedMessageListComponents_1.Item }, virtuosoComponentsFromProps)} computeItemKey={computeItemKey} context={{
            additionalMessageInputProps: additionalMessageInputProps,
            closeReactionSelectorOnClick: closeReactionSelectorOnClick,
            customClasses: customClasses,
            customMessageActions: customMessageActions,
            customMessageRenderer: customMessageRenderer,
            DateSeparator: DateSeparator,
            firstUnreadMessageId: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.first_unread_message_id,
            formatDate: formatDate,
            head: head,
            lastReadDate: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.last_read,
            lastReadMessageId: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.last_read_message_id,
            lastReceivedMessageId: lastReceivedMessageId,
            loadingMore: loadingMore,
            Message: MessageUIComponent,
            messageActions: messageActions,
            messageGroupStyles: messageGroupStyles,
            MessageSystem: MessageSystem,
            numItemsPrepended: numItemsPrepended,
            openThread: openThread,
            ownMessagesReadByOthers: ownMessagesReadByOthers,
            processedMessages: processedMessages,
            reactionDetailsSort: reactionDetailsSort,
            shouldGroupByUser: shouldGroupByUser,
            sortReactionDetails: sortReactionDetails,
            sortReactions: sortReactions,
            threadList: threadList,
            unreadMessageCount: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages,
            UnreadMessagesSeparator: UnreadMessagesSeparator,
            virtuosoRef: virtuoso,
        }} firstItemIndex={(0, VirtualizedMessageListComponents_1.calculateFirstItemIndex)(numItemsPrepended)} followOutput={followOutput} increaseViewportBy={{ bottom: 200, top: 0 }} initialTopMostItemIndex={calculateInitialTopMostItemIndex(processedMessages, highlightedMessageId)} itemContent={VirtualizedMessageListComponents_1.messageRenderer} itemSize={fractionalItemSize} itemsRendered={handleItemsRendered} key={messageSetKey} overscan={overscan} ref={virtuoso} style={{ overflowX: 'hidden' }} totalCount={processedMessages.length} {...overridingVirtuosoProps} {...(scrollSeekPlaceHolder ? { scrollSeek: scrollSeekPlaceHolder } : {})} {...(defaultItemHeight ? { defaultItemHeight: defaultItemHeight } : {})}/>
          </div>
        </DialogManagerProvider>
        {TypingIndicator && <TypingIndicator />}
      </MessageListMainPanel>
      <MessageListNotifications hasNewMessages={newMessagesNotification} isMessageListScrolledToBottom={isMessageListScrolledToBottom} isNotAtLatestMessageSet={hasMoreNewer} MessageNotification={MessageNotification} notifications={notifications} scrollToBottom={scrollToBottom} threadList={threadList} unreadCount={threadList ? undefined : channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages}/>
      {giphyPreviewMessage && <GiphyPreviewMessage message={giphyPreviewMessage}/>}
    </VirtualizedMessageListContextProvider>);
};
/**
 * The VirtualizedMessageList component renders a list of messages in a virtualized list.
 * It is a consumer of the React contexts set in [Channel](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Channel/Channel.tsx).
 */
function VirtualizedMessageList(props) {
    var _a;
    var _b = useChannelActionContext('VirtualizedMessageList'), jumpToLatestMessage = _b.jumpToLatestMessage, loadMore = _b.loadMore, loadMoreNewer = _b.loadMoreNewer;
    var _c = useChannelStateContext('VirtualizedMessageList'), channel = _c.channel, channelUnreadUiState = _c.channelUnreadUiState, hasMore = _c.hasMore, hasMoreNewer = _c.hasMoreNewer, highlightedMessageId = _c.highlightedMessageId, loadingMore = _c.loadingMore, loadingMoreNewer = _c.loadingMoreNewer, contextMessages = _c.messages, notifications = _c.notifications, read = _c.read, suppressAutoscroll = _c.suppressAutoscroll;
    var messages = props.messages || contextMessages;
    return (<VirtualizedMessageListWithContext channel={channel} channelUnreadUiState={(_a = props.channelUnreadUiState) !== null && _a !== void 0 ? _a : channelUnreadUiState} hasMore={!!hasMore} hasMoreNewer={!!hasMoreNewer} highlightedMessageId={highlightedMessageId} jumpToLatestMessage={jumpToLatestMessage} loadingMore={!!loadingMore} loadingMoreNewer={!!loadingMoreNewer} loadMore={loadMore} loadMoreNewer={loadMoreNewer} messages={messages} notifications={notifications} read={read} suppressAutoscroll={suppressAutoscroll} {...props}/>);
}
