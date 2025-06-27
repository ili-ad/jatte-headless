"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadListItemUI = exports.attachmentTypeIconMap = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var Timestamp_1 = require("../../Message/Timestamp");
var Avatar_1 = require("../../Avatar");
var icons_1 = require("../icons");
var UnreadCountBadge = function (props) { return <div {...props}/>; }; // temporary shim
var useChannelPreviewInfo = function (_) { return ({ displayTitle: '' }); }; // temporary shim
var useChatContext = function () { return ({ client: {} }); };
var ChatView_1 = require("../../ChatView");
var useThreadListItemContext = function () { return ({}); };
var useStateStore = function (_store, selector) { return selector({}); };
/**
 * TODO:
 * - maybe hover state? ask design
 */
exports.attachmentTypeIconMap = {
    audio: '🔈',
    file: '📄',
    image: '📷',
    video: '🎥',
    voiceRecording: '🎙️',
};
// TODO: translations
var getTitleFromMessage = function (_a) {
    var _b, _c, _d, _e;
    var currentUserId = _a.currentUserId, message = _a.message;
    var attachment = (_b = message === null || message === void 0 ? void 0 : message.attachments) === null || _b === void 0 ? void 0 : _b.at(0);
    var attachmentIcon = '';
    if (attachment) {
        attachmentIcon +=
            (_d = exports.attachmentTypeIconMap[(_c = attachment.type) !== null && _c !== void 0 ? _c : 'file']) !== null && _d !== void 0 ? _d : exports.attachmentTypeIconMap.file;
    }
    var messageBelongsToCurrentUser = ((_e = message === null || message === void 0 ? void 0 : message.user) === null || _e === void 0 ? void 0 : _e.id) === currentUserId;
    if ((message === null || message === void 0 ? void 0 : message.deleted_at) && message.parent_id)
        return (0, clsx_1.default)(messageBelongsToCurrentUser && 'You:', 'This reply was deleted.');
    if ((message === null || message === void 0 ? void 0 : message.deleted_at) && !message.parent_id)
        return (0, clsx_1.default)(messageBelongsToCurrentUser && 'You:', 'The source message was deleted.');
    if ((attachment === null || attachment === void 0 ? void 0 : attachment.type) === 'voiceRecording')
        return (0, clsx_1.default)(attachmentIcon, messageBelongsToCurrentUser && 'You:', 'Voice message');
    return (0, clsx_1.default)(attachmentIcon, messageBelongsToCurrentUser && 'You:', (message === null || message === void 0 ? void 0 : message.text) || (attachment === null || attachment === void 0 ? void 0 : attachment.fallback) || 'N/A');
};
var ThreadListItemUI = function (props) {
    var _a, _b, _c;
    var client = useChatContext().client;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    var thread = useThreadListItemContext();
    var selector = (0, react_1.useCallback)(function (nextValue) {
        var _a;
        return ({
            channel: nextValue.channel,
            deletedAt: nextValue.deletedAt,
            latestReply: nextValue.replies.at(-1),
            ownUnreadMessageCount: (client.userID && ((_a = nextValue.read[client.userID]) === null || _a === void 0 ? void 0 : _a.unreadMessageCount)) || 0,
            parentMessage: nextValue.parentMessage,
        });
    }, [client]);
    var _d = useStateStore(thread.state, selector), channel = _d.channel, deletedAt = _d.deletedAt, latestReply = _d.latestReply, ownUnreadMessageCount = _d.ownUnreadMessageCount, parentMessage = _d.parentMessage;
    var channelDisplayTitle = useChannelPreviewInfo({ channel: channel }).displayTitle;
    var _e = (0, ChatView_1.useThreadsViewContext)(), activeThread = _e.activeThread, setActiveThread = _e.setActiveThread;
    var avatarProps = deletedAt ? null : latestReply === null || latestReply === void 0 ? void 0 : latestReply.user;
    return (<button aria-selected={activeThread === thread} className='str-chat__thread-list-item' data-thread-id={thread.id} onClick={function () { return setActiveThread(thread); }} role='option' {...props}>
      <div className='str-chat__thread-list-item__channel'>
        <icons_1.Icon.MessageBubble />

        <div className='str-chat__thread-list-item__channel-text'>
          {channelDisplayTitle}
        </div>

      </div>
      <div className='str-chat__thread-list-item__parent-message'>
        <div className='str-chat__thread-list-item__parent-message-text'>
          {/* TODO: use thread.title instead? */}
          replied to: {getTitleFromMessage({ message: parentMessage })}
        </div>
        {!deletedAt && <UnreadCountBadge count={ownUnreadMessageCount}/>}
      </div>
      <div className='str-chat__thread-list-item__latest-reply'>
        <Avatar_1.Avatar {...avatarProps}/>
        <div className='str-chat__thread-list-item__latest-reply-details'>
          {!deletedAt && (<div className='str-chat__thread-list-item__latest-reply-created-by'>
              {((_a = latestReply === null || latestReply === void 0 ? void 0 : latestReply.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = latestReply === null || latestReply === void 0 ? void 0 : latestReply.user) === null || _b === void 0 ? void 0 : _b.id) || 'Unknown sender'}
            </div>)}
          <div className='str-chat__thread-list-item__latest-reply-text-and-timestamp'>
            <div className='str-chat__thread-list-item__latest-reply-text'>
              {deletedAt
            ? 'This thread was deleted'
            : getTitleFromMessage({
                currentUserId: (_c = client.user) === null || _c === void 0 ? void 0 : _c.id,
                message: latestReply,
            })}

            </div>
            <div className='str-chat__thread-list-item__latest-reply-timestamp'>
              <Timestamp_1.Timestamp timestamp={deletedAt !== null && deletedAt !== void 0 ? deletedAt : latestReply === null || latestReply === void 0 ? void 0 : latestReply.created_at}/>
            </div>
          </div>
        </div>
      </div>
    </button>);
};
exports.ThreadListItemUI = ThreadListItemUI;
