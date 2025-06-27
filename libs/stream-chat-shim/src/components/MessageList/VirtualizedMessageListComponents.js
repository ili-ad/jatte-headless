"use strict";
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
exports.messageRenderer = exports.EmptyPlaceholder = exports.Header = exports.Item = exports.makeItemsRenderedHandler = void 0;
exports.calculateItemIndex = calculateItemIndex;
exports.calculateFirstItemIndex = calculateFirstItemIndex;
var clsx_1 = require("clsx");
var lodash_throttle_1 = require("lodash.throttle");
var react_1 = require("react");
var EmptyStateIndicator_1 = require("../EmptyStateIndicator");
var Loading_1 = require("../Loading");
var Message_1 = require("../Message");
var context_1 = require("../../context");
var getIsFirstUnreadMessage = function (_) { return false; }; // temporary shim
var isDateSeparatorMessage = function (_) { return false; }; // temporary shim
var isIntroMessage = function (_) { return false; }; // temporary shim
var PREPEND_OFFSET = Math.pow(10, 7);
function calculateItemIndex(virtuosoIndex, numItemsPrepended) {
    return virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
}
function calculateFirstItemIndex(numItemsPrepended) {
    return PREPEND_OFFSET - numItemsPrepended;
}
var makeItemsRenderedHandler = function (renderedItemsActions, processedMessages) {
    return (0, lodash_throttle_1.default)(function (items) {
        var renderedMessages = items
            .map(function (item) {
            if (!item.originalIndex)
                return undefined;
            return processedMessages[calculateItemIndex(item.originalIndex, PREPEND_OFFSET)];
        })
            .filter(function (msg) { return !!msg; });
        renderedItemsActions.forEach(function (action) {
            return action(renderedMessages);
        });
    }, 200);
};
exports.makeItemsRenderedHandler = makeItemsRenderedHandler;
// using 'display: inline-block'
// traps CSS margins of the item elements, preventing incorrect item measurements
var Item = function (_a) {
    var _b;
    var _c;
    var context = _a.context, props = __rest(_a, ["context"]);
    if (!context)
        return <></>;
    var message = context.processedMessages[calculateItemIndex(props['data-item-index'], context.numItemsPrepended)];
    var groupStyles = context.messageGroupStyles[message.id];
    return (<div {...props} className={((_c = context === null || context === void 0 ? void 0 : context.customClasses) === null || _c === void 0 ? void 0 : _c.virtualMessage) ||
            (0, clsx_1.default)('str-chat__virtual-list-message-wrapper str-chat__li', (_b = {},
                _b["str-chat__li--".concat(groupStyles)] = groupStyles,
                _b))}/>);
};
exports.Item = Item;
var Header = function (_a) {
    var context = _a.context;
    var _b = (0, context_1.useComponentContext)('VirtualizedMessageListHeader').LoadingIndicator, LoadingIndicator = _b === void 0 ? Loading_1.LoadingIndicator : _b;
    return (<>
      {context === null || context === void 0 ? void 0 : context.head}
      {(context === null || context === void 0 ? void 0 : context.loadingMore) && LoadingIndicator && (<div className='str-chat__virtual-list__loading'>
          <LoadingIndicator size={20}/>
        </div>)}
    </>);
};
exports.Header = Header;
var EmptyPlaceholder = function (_a) {
    var context = _a.context;
    var _b = (0, context_1.useComponentContext)('VirtualizedMessageList').EmptyStateIndicator, EmptyStateIndicator = _b === void 0 ? EmptyStateIndicator_1.EmptyStateIndicator : _b;
    // prevent showing that there are no messages if there actually are messages (for some reason virtuoso decides to render empty placeholder first, even though it has the totalCount prop > 0)
    if (typeof (context === null || context === void 0 ? void 0 : context.processedMessages) !== 'undefined' &&
        context.processedMessages.length > 0)
        return null;
    return (<>
      {EmptyStateIndicator && (<EmptyStateIndicator listType={(context === null || context === void 0 ? void 0 : context.threadList) ? 'thread' : 'message'}/>)}
    </>);
};
exports.EmptyPlaceholder = EmptyPlaceholder;
var messageRenderer = function (virtuosoIndex, _data, virtuosoContext) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var additionalMessageInputProps = virtuosoContext.additionalMessageInputProps, closeReactionSelectorOnClick = virtuosoContext.closeReactionSelectorOnClick, customMessageActions = virtuosoContext.customMessageActions, customMessageRenderer = virtuosoContext.customMessageRenderer, DateSeparator = virtuosoContext.DateSeparator, firstUnreadMessageId = virtuosoContext.firstUnreadMessageId, formatDate = virtuosoContext.formatDate, lastReadDate = virtuosoContext.lastReadDate, lastReadMessageId = virtuosoContext.lastReadMessageId, lastReceivedMessageId = virtuosoContext.lastReceivedMessageId, MessageUIComponent = virtuosoContext.Message, messageActions = virtuosoContext.messageActions, messageGroupStyles = virtuosoContext.messageGroupStyles, MessageSystem = virtuosoContext.MessageSystem, numItemsPrepended = virtuosoContext.numItemsPrepended, openThread = virtuosoContext.openThread, ownMessagesReadByOthers = virtuosoContext.ownMessagesReadByOthers, messageList = virtuosoContext.processedMessages, reactionDetailsSort = virtuosoContext.reactionDetailsSort, shouldGroupByUser = virtuosoContext.shouldGroupByUser, sortReactionDetails = virtuosoContext.sortReactionDetails, sortReactions = virtuosoContext.sortReactions, threadList = virtuosoContext.threadList, _j = virtuosoContext.unreadMessageCount, unreadMessageCount = _j === void 0 ? 0 : _j, UnreadMessagesSeparator = virtuosoContext.UnreadMessagesSeparator, virtuosoRef = virtuosoContext.virtuosoRef;
    var streamMessageIndex = calculateItemIndex(virtuosoIndex, numItemsPrepended);
    if (customMessageRenderer) {
        return customMessageRenderer(messageList, streamMessageIndex);
    }
    var message = messageList[streamMessageIndex];
    if (!message || isIntroMessage(message))
        return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso
    if (isDateSeparatorMessage(message)) {
        return DateSeparator ? (<DateSeparator date={message.date} unread={message.unread}/>) : null;
    }
    if (message.type === 'system') {
        return MessageSystem ? <MessageSystem message={message}/> : null;
    }
    var maybePrevMessage = messageList[streamMessageIndex - 1];
    var maybeNextMessage = messageList[streamMessageIndex + 1];
    var groupedByUser = shouldGroupByUser &&
        streamMessageIndex > 0 &&
        ((_a = message.user) === null || _a === void 0 ? void 0 : _a.id) === ((_b = maybePrevMessage === null || maybePrevMessage === void 0 ? void 0 : maybePrevMessage.user) === null || _b === void 0 ? void 0 : _b.id);
    // FIXME: firstOfGroup & endOfGroup should be derived from groupStyles which apply a more complex logic
    var firstOfGroup = shouldGroupByUser &&
        (((_c = message.user) === null || _c === void 0 ? void 0 : _c.id) !== ((_d = maybePrevMessage === null || maybePrevMessage === void 0 ? void 0 : maybePrevMessage.user) === null || _d === void 0 ? void 0 : _d.id) ||
            (maybePrevMessage && (0, Message_1.isMessageEdited)(maybePrevMessage)));
    var endOfGroup = shouldGroupByUser &&
        (((_e = message.user) === null || _e === void 0 ? void 0 : _e.id) !== ((_f = maybeNextMessage === null || maybeNextMessage === void 0 ? void 0 : maybeNextMessage.user) === null || _f === void 0 ? void 0 : _f.id) || (0, Message_1.isMessageEdited)(message));
    var isFirstUnreadMessage = getIsFirstUnreadMessage({
        firstUnreadMessageId: firstUnreadMessageId,
        isFirstMessage: streamMessageIndex === 0,
        lastReadDate: lastReadDate,
        lastReadMessageId: lastReadMessageId,
        message: message,
        previousMessage: streamMessageIndex ? messageList[streamMessageIndex - 1] : undefined,
        unreadMessageCount: unreadMessageCount,
    });
    return (<>
      {isFirstUnreadMessage && (<div className='str-chat__unread-messages-separator-wrapper'>
          <UnreadMessagesSeparator unreadCount={unreadMessageCount}/>
        </div>)}
      <Message_1.Message additionalMessageInputProps={additionalMessageInputProps} autoscrollToBottom={(_g = virtuosoRef.current) === null || _g === void 0 ? void 0 : _g.autoscrollToBottom} closeReactionSelectorOnClick={closeReactionSelectorOnClick} customMessageActions={customMessageActions} endOfGroup={endOfGroup} firstOfGroup={firstOfGroup} formatDate={formatDate} groupedByUser={groupedByUser} groupStyles={[(_h = messageGroupStyles[message.id]) !== null && _h !== void 0 ? _h : '']} lastReceivedId={lastReceivedMessageId} message={message} Message={MessageUIComponent} messageActions={messageActions} openThread={openThread} reactionDetailsSort={reactionDetailsSort} readBy={ownMessagesReadByOthers[message.id] || []} sortReactionDetails={sortReactionDetails} sortReactions={sortReactions} threadList={threadList}/>
    </>);
};
exports.messageRenderer = messageRenderer;
