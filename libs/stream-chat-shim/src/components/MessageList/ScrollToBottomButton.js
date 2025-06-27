"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollToBottomButton = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var icons_1 = require("./icons");
var context_1 = require("../../context");
var UnMemoizedScrollToBottomButton = function (props) {
    var isMessageListScrolledToBottom = props.isMessageListScrolledToBottom, onClick = props.onClick, threadList = props.threadList;
    var _a = (0, context_1.useChatContext)(), activeChannel = _a.channel, client = _a.client;
    var thread = (0, context_1.useChannelStateContext)().thread;
    var _b = (0, react_1.useState)((activeChannel === null || activeChannel === void 0 ? void 0 : activeChannel.countUnread()) || 0), countUnread = _b[0], setCountUnread = _b[1];
    var _c = (0, react_1.useState)((thread === null || thread === void 0 ? void 0 : thread.reply_count) || 0), replyCount = _c[0], setReplyCount = _c[1];
    var observedEvent = threadList ? 'message.updated' : 'message.new';
    (0, react_1.useEffect)(function () {
        var handleEvent = function (event) {
            var _a, _b, _c, _d, _e;
            var newMessageInAnotherChannel = event.cid !== (activeChannel === null || activeChannel === void 0 ? void 0 : activeChannel.cid);
            var newMessageIsMine = ((_a = event.user) === null || _a === void 0 ? void 0 : _a.id) === ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id);
            var isThreadOpen = !!thread;
            var newMessageIsReply = !!((_c = event.message) === null || _c === void 0 ? void 0 : _c.parent_id);
            var dontIncreaseMainListCounterOnNewReply = isThreadOpen && !threadList && newMessageIsReply;
            if (isMessageListScrolledToBottom ||
                newMessageInAnotherChannel ||
                newMessageIsMine ||
                dontIncreaseMainListCounterOnNewReply) {
                return;
            }
            if (event.type === 'message.new') {
                // cannot rely on channel.countUnread because active channel is automatically marked read
                setCountUnread(function (prev) { return prev + 1; });
            }
            else if (((_d = event.message) === null || _d === void 0 ? void 0 : _d.id) === (thread === null || thread === void 0 ? void 0 : thread.id)) {
                var newReplyCount_1 = ((_e = event.message) === null || _e === void 0 ? void 0 : _e.reply_count) || 0;
                setCountUnread(function () { return newReplyCount_1 - replyCount; });
            }
        };
        client.on(observedEvent, handleEvent);
        return function () {
            client.off(observedEvent, handleEvent);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChannel, isMessageListScrolledToBottom, observedEvent, replyCount, thread]);
    (0, react_1.useEffect)(function () {
        if (isMessageListScrolledToBottom) {
            setCountUnread(0);
            setReplyCount((thread === null || thread === void 0 ? void 0 : thread.reply_count) || 0);
        }
    }, [isMessageListScrolledToBottom, thread]);
    if (isMessageListScrolledToBottom)
        return null;
    return (<div className='str-chat__jump-to-latest-message'>
      <button aria-live='polite' className={"\n        str-chat__message-notification-scroll-to-latest\n        str-chat__circle-fab\n      "} data-testid='message-notification' onClick={onClick}>
        <icons_1.ArrowDown />
        {countUnread > 0 && (<div className={(0, clsx_1.default)('str-chat__message-notification', 'str-chat__jump-to-latest-unread-count')} data-testid={'unread-message-notification-counter'}>
            {countUnread}
          </div>)}
      </button>
    </div>);
};
exports.ScrollToBottomButton = react_1.default.memo(UnMemoizedScrollToBottomButton);
