"use strict";
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
exports.MessageList = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var MessageList_1 = require("./hooks/MessageList");
var useMarkRead_1 = require("./hooks/useMarkRead");
var MessageNotification_1 = require("./MessageNotification");
var MessageListNotifications_1 = require("./MessageListNotifications");
var UnreadMessagesNotification_1 = require("./UnreadMessagesNotification");
var ChannelActionContext_1 = require("../../context/ChannelActionContext");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
var context_1 = require("../../context");
var ChatContext_1 = require("../../context/ChatContext");
var ComponentContext_1 = require("../../context/ComponentContext");
var MessageListContext_1 = require("../../context/MessageListContext");
var EmptyStateIndicator_1 = require("../EmptyStateIndicator");
var InfiniteScroll_1 = require("../InfiniteScrollPaginator/InfiniteScroll");
var Loading_1 = require("../Loading");
var utils_1 = require("../Message/utils");
var TypingIndicator_1 = require("../TypingIndicator");
var MessageListMainPanel_1 = require("./MessageListMainPanel");
var renderMessages_1 = require("./renderMessages");
var useStableId_1 = require("../UtilityComponents/useStableId");
var limits_1 = require("../../constants/limits");
var MessageListWithContext = function (props) {
    var channel = props.channel, channelUnreadUiState = props.channelUnreadUiState, _a = props.disableDateSeparator, disableDateSeparator = _a === void 0 ? false : _a, groupStyles = props.groupStyles, _b = props.hasMoreNewer, hasMoreNewer = _b === void 0 ? false : _b, headerPosition = props.headerPosition, _c = props.hideDeletedMessages, hideDeletedMessages = _c === void 0 ? false : _c, _d = props.hideNewMessageSeparator, hideNewMessageSeparator = _d === void 0 ? false : _d, highlightedMessageId = props.highlightedMessageId, _e = props.internalInfiniteScrollProps, _f = _e === void 0 ? {} : _e, _g = _f.threshold, loadMoreScrollThreshold = _g === void 0 ? limits_1.DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD : _g, restInternalInfiniteScrollProps = __rest(_f, ["threshold"]), _h = props.jumpToLatestMessage, jumpToLatestMessage = _h === void 0 ? function () { return Promise.resolve(); } : _h, loadMoreCallback = props.loadMore, loadMoreNewerCallback = props.loadMoreNewer, // @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
    maxTimeBetweenGroupedMessages = props.maxTimeBetweenGroupedMessages, _j = props.messageActions, messageActions = _j === void 0 ? Object.keys(utils_1.MESSAGE_ACTIONS) : _j, _k = props.messageLimit, messageLimit = _k === void 0 ? limits_1.DEFAULT_NEXT_CHANNEL_PAGE_SIZE : _k, _l = props.messages, messages = _l === void 0 ? [] : _l, _m = props.noGroupByUser, noGroupByUser = _m === void 0 ? false : _m, notifications = props.notifications, _o = props.pinPermissions, pinPermissions = _o === void 0 ? utils_1.defaultPinPermissions : _o, reactionDetailsSort = props.reactionDetailsSort, read = props.read, _p = props.renderMessages, renderMessages = _p === void 0 ? renderMessages_1.defaultRenderMessages : _p, _q = props.returnAllReadData, returnAllReadData = _q === void 0 ? false : _q, reviewProcessedMessage = props.reviewProcessedMessage, showUnreadNotificationAlways = props.showUnreadNotificationAlways, sortReactionDetails = props.sortReactionDetails, sortReactions = props.sortReactions, suppressAutoscroll = props.suppressAutoscroll, _r = props.threadList, threadList = _r === void 0 ? false : _r, _s = props.unsafeHTML, unsafeHTML = _s === void 0 ? false : _s;
    var _t = react_1.default.useState(null), listElement = _t[0], setListElement = _t[1];
    var _u = react_1.default.useState(null), ulElement = _u[0], setUlElement = _u[1];
    var customClasses = (0, ChatContext_1.useChatContext)('MessageList').customClasses;
    var _v = (0, ComponentContext_1.useComponentContext)('MessageList'), _w = _v.EmptyStateIndicator, EmptyStateIndicator = _w === void 0 ? EmptyStateIndicator_1.EmptyStateIndicator : _w, _x = _v.LoadingIndicator, LoadingIndicator = _x === void 0 ? Loading_1.LoadingIndicator : _x, _y = _v.MessageListMainPanel, MessageListMainPanel = _y === void 0 ? MessageListMainPanel_1.MessageListMainPanel : _y, _z = _v.MessageListNotifications, MessageListNotifications = _z === void 0 ? MessageListNotifications_1.MessageListNotifications : _z, _0 = _v.MessageNotification, MessageNotification = _0 === void 0 ? MessageNotification_1.MessageNotification : _0, _1 = _v.TypingIndicator, TypingIndicator = _1 === void 0 ? TypingIndicator_1.TypingIndicator : _1, _2 = _v.UnreadMessagesNotification, UnreadMessagesNotification = _2 === void 0 ? UnreadMessagesNotification_1.UnreadMessagesNotification : _2;
    var _3 = (0, MessageList_1.useScrollLocationLogic)({
        hasMoreNewer: hasMoreNewer,
        listElement: listElement,
        loadMoreScrollThreshold: loadMoreScrollThreshold,
        messages: messages, // todo: is it correct to base the scroll logic on an array that does not contain date separators or intro?
        scrolledUpThreshold: props.scrolledUpThreshold,
        suppressAutoscroll: suppressAutoscroll,
    }), hasNewMessages = _3.hasNewMessages, isMessageListScrolledToBottom = _3.isMessageListScrolledToBottom, onScroll = _3.onScroll, scrollToBottom = _3.scrollToBottom, wrapperRect = _3.wrapperRect;
    var showUnreadMessagesNotification = (0, MessageList_1.useUnreadMessagesNotification)({
        isMessageListScrolledToBottom: isMessageListScrolledToBottom,
        showAlways: !!showUnreadNotificationAlways,
        unreadCount: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages,
    }).show;
    (0, useMarkRead_1.useMarkRead)({
        isMessageListScrolledToBottom: isMessageListScrolledToBottom,
        messageListIsThread: threadList,
        wasMarkedUnread: !!(channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.first_unread_message_id),
    });
    var _4 = (0, MessageList_1.useEnrichedMessages)({
        channel: channel,
        disableDateSeparator: disableDateSeparator,
        groupStyles: groupStyles,
        headerPosition: headerPosition,
        hideDeletedMessages: hideDeletedMessages,
        hideNewMessageSeparator: hideNewMessageSeparator,
        maxTimeBetweenGroupedMessages: maxTimeBetweenGroupedMessages,
        messages: messages,
        noGroupByUser: noGroupByUser,
        reviewProcessedMessage: reviewProcessedMessage,
    }), messageGroupStyles = _4.messageGroupStyles, enrichedMessages = _4.messages;
    var elements = (0, MessageList_1.useMessageListElements)({
        channelUnreadUiState: channelUnreadUiState,
        enrichedMessages: enrichedMessages,
        internalMessageProps: {
            additionalMessageInputProps: props.additionalMessageInputProps,
            closeReactionSelectorOnClick: props.closeReactionSelectorOnClick,
            customMessageActions: props.customMessageActions,
            disableQuotedMessages: props.disableQuotedMessages,
            formatDate: props.formatDate,
            getDeleteMessageErrorNotification: props.getDeleteMessageErrorNotification,
            getFlagMessageErrorNotification: props.getFlagMessageErrorNotification,
            getFlagMessageSuccessNotification: props.getFlagMessageSuccessNotification,
            getMarkMessageUnreadErrorNotification: props.getMarkMessageUnreadErrorNotification,
            getMarkMessageUnreadSuccessNotification: props.getMarkMessageUnreadSuccessNotification,
            getMuteUserErrorNotification: props.getMuteUserErrorNotification,
            getMuteUserSuccessNotification: props.getMuteUserSuccessNotification,
            getPinMessageErrorNotification: props.getPinMessageErrorNotification,
            Message: props.Message,
            messageActions: messageActions,
            messageListRect: wrapperRect,
            onlySenderCanEdit: props.onlySenderCanEdit,
            onMentionsClick: props.onMentionsClick,
            onMentionsHover: props.onMentionsHover,
            onUserClick: props.onUserClick,
            onUserHover: props.onUserHover,
            openThread: props.openThread,
            pinPermissions: pinPermissions,
            reactionDetailsSort: reactionDetailsSort,
            renderText: props.renderText,
            retrySendMessage: props.retrySendMessage,
            sortReactionDetails: sortReactionDetails,
            sortReactions: sortReactions,
            unsafeHTML: unsafeHTML,
        },
        messageGroupStyles: messageGroupStyles,
        read: read,
        renderMessages: renderMessages,
        returnAllReadData: returnAllReadData,
        threadList: threadList,
    });
    var messageListClass = (customClasses === null || customClasses === void 0 ? void 0 : customClasses.messageList) || 'str-chat__list';
    var loadMore = react_1.default.useCallback(function () {
        if (loadMoreCallback) {
            loadMoreCallback(messageLimit);
        }
    }, [loadMoreCallback, messageLimit]);
    var loadMoreNewer = react_1.default.useCallback(function () {
        if (loadMoreNewerCallback) {
            loadMoreNewerCallback(messageLimit);
        }
    }, [loadMoreNewerCallback, messageLimit]);
    var scrollToBottomFromNotification = react_1.default.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!hasMoreNewer) return [3 /*break*/, 2];
                    return [4 /*yield*/, jumpToLatestMessage()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    scrollToBottom();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [scrollToBottom, hasMoreNewer]);
    react_1.default.useLayoutEffect(function () {
        if (highlightedMessageId) {
            var element = ulElement === null || ulElement === void 0 ? void 0 : ulElement.querySelector("[data-message-id='".concat(highlightedMessageId, "']"));
            element === null || element === void 0 ? void 0 : element.scrollIntoView({ block: 'center' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlightedMessageId]);
    var id = (0, useStableId_1.useStableId)();
    var showEmptyStateIndicator = elements.length === 0 && !threadList;
    var dialogManagerId = threadList
        ? "message-list-dialog-manager-thread-".concat(id)
        : "message-list-dialog-manager-".concat(id);
    return (<MessageListContext_1.MessageListContextProvider value={{ listElement: listElement, scrollToBottom: scrollToBottom }}>
      <MessageListMainPanel>
        <context_1.DialogManagerProvider id={dialogManagerId}>
          {!threadList && showUnreadMessagesNotification && (<UnreadMessagesNotification unreadCount={channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages}/>)}
          <div className={(0, clsx_1.default)(messageListClass, customClasses === null || customClasses === void 0 ? void 0 : customClasses.threadList)} onScroll={onScroll} ref={setListElement} tabIndex={0}>
            {showEmptyStateIndicator ? (<EmptyStateIndicator listType={threadList ? 'thread' : 'message'}/>) : (<InfiniteScroll_1.InfiniteScroll className='str-chat__message-list-scroll' data-testid='reverse-infinite-scroll' hasNextPage={props.hasMoreNewer} hasPreviousPage={props.hasMore} head={props.head} isLoading={props.loadingMore} loader={<div className='str-chat__list__loading' key='loading-indicator'>
                    {props.loadingMore && <LoadingIndicator size={20}/>}
                  </div>} loadNextPage={loadMoreNewer} loadPreviousPage={loadMore} threshold={loadMoreScrollThreshold} {...restInternalInfiniteScrollProps}>
                <ul className='str-chat__ul' ref={setUlElement}>
                  {elements}
                </ul>
                <TypingIndicator threadList={threadList}/>

                <div key='bottom'/>
              </InfiniteScroll_1.InfiniteScroll>)}
          </div>
        </context_1.DialogManagerProvider>
      </MessageListMainPanel>
      <MessageListNotifications hasNewMessages={hasNewMessages} isMessageListScrolledToBottom={isMessageListScrolledToBottom} isNotAtLatestMessageSet={hasMoreNewer} MessageNotification={MessageNotification} notifications={notifications} scrollToBottom={scrollToBottomFromNotification} threadList={threadList} unreadCount={threadList ? undefined : channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages}/>
    </MessageListContext_1.MessageListContextProvider>);
};
/**
 * The MessageList component renders a list of Messages.
 * It is a consumer of the following contexts:
 * - [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/)
 * - [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/)
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
var MessageList = function (props) {
    var _a = (0, ChannelActionContext_1.useChannelActionContext)('MessageList'), jumpToLatestMessage = _a.jumpToLatestMessage, loadMore = _a.loadMore, loadMoreNewer = _a.loadMoreNewer;
    var _b = (0, ChannelStateContext_1.useChannelStateContext)('MessageList'), membersPropToNotPass = _b.members, // eslint-disable-line @typescript-eslint/no-unused-vars
    mutesPropToNotPass = _b.mutes, // eslint-disable-line @typescript-eslint/no-unused-vars
    watchersPropToNotPass = _b.watchers, // eslint-disable-line @typescript-eslint/no-unused-vars
    restChannelStateContext = __rest(_b, ["members", "mutes", "watchers"]);
    return (<MessageListWithContext jumpToLatestMessage={jumpToLatestMessage} loadMore={loadMore} loadMoreNewer={loadMoreNewer} {...restChannelStateContext} {...props}/>);
};
exports.MessageList = MessageList;
