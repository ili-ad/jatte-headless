"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSimple = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var icons_1 = require("./icons");
var MessageBounce_1 = require("../MessageBounce");
var MessageDeleted_1 = require("./MessageDeleted");
var MessageBlocked_1 = require("./MessageBlocked");
var MessageOptions_1 = require("./MessageOptions");
var MessageRepliesCountButton_1 = require("./MessageRepliesCountButton");
var MessageStatus_1 = require("./MessageStatus");
var MessageText_1 = require("./MessageText");
var MessageTimestamp_1 = require("./MessageTimestamp");
var StreamedMessageText_1 = require("./StreamedMessageText");
var MessageList_1 = require("../MessageList");
var MessageIsThreadReplyInChannelButtonIndicator_1 = require("./MessageIsThreadReplyInChannelButtonIndicator");
var ReminderNotification_1 = require("./ReminderNotification");
var hooks_1 = require("./hooks");
var utils_1 = require("./utils");
var Avatar_1 = require("../Avatar");
var Attachment_1 = require("../Attachment");
var MessageInput_1 = require("../MessageInput");
var Poll_1 = require("../Poll");
var Reactions_1 = require("../Reactions");
var MessageBounceModal_1 = require("../MessageBounce/MessageBounceModal");
var ComponentContext_1 = require("../../context/ComponentContext");
var MessageContext_1 = require("../../context/MessageContext");
var context_1 = require("../../context");
var MessageEditedTimestamp_1 = require("./MessageEditedTimestamp");
var MessageSimpleWithContext = function (props) {
    var _a, _b, _c;
    var additionalMessageInputProps = props.additionalMessageInputProps, editing = props.editing, endOfGroup = props.endOfGroup, firstOfGroup = props.firstOfGroup, groupedByUser = props.groupedByUser, handleAction = props.handleAction, handleOpenThread = props.handleOpenThread, handleRetry = props.handleRetry, highlighted = props.highlighted, isMessageAIGenerated = props.isMessageAIGenerated, isMyMessage = props.isMyMessage, message = props.message, onUserClick = props.onUserClick, onUserHover = props.onUserHover, renderText = props.renderText, threadList = props.threadList;
    var client = (0, context_1.useChatContext)('MessageSimple').client;
    var t = (0, context_1.useTranslationContext)('MessageSimple').t;
    var _d = (0, react_1.useState)(false), isBounceDialogOpen = _d[0], setIsBounceDialogOpen = _d[1];
    var _e = (0, react_1.useState)(false), isEditedTimestampOpen = _e[0], setEditedTimestampOpen = _e[1];
    var reminder = (0, hooks_1.useMessageReminder)(message.id);
    var _f = (0, ComponentContext_1.useComponentContext)('MessageSimple'), _g = _f.Attachment, Attachment = _g === void 0 ? Attachment_1.Attachment : _g, _h = _f.Avatar, Avatar = _h === void 0 ? Avatar_1.Avatar : _h, _j = _f.MessageOptions, MessageOptions = _j === void 0 ? MessageOptions_1.MessageOptions : _j, 
    // TODO: remove this "passthrough" in the next
    // major release and use the new default instead
    _k = _f.MessageActions, 
    // TODO: remove this "passthrough" in the next
    // major release and use the new default instead
    MessageActions = _k === void 0 ? MessageOptions : _k, _l = _f.MessageBlocked, MessageBlocked = _l === void 0 ? MessageBlocked_1.MessageBlocked : _l, _m = _f.MessageBouncePrompt, MessageBouncePrompt = _m === void 0 ? MessageBounce_1.MessageBouncePrompt : _m, _o = _f.MessageDeleted, MessageDeleted = _o === void 0 ? MessageDeleted_1.MessageDeleted : _o, _p = _f.MessageIsThreadReplyInChannelButtonIndicator, MessageIsThreadReplyInChannelButtonIndicator = _p === void 0 ? MessageIsThreadReplyInChannelButtonIndicator_1.MessageIsThreadReplyInChannelButtonIndicator : _p, _q = _f.MessageRepliesCountButton, MessageRepliesCountButton = _q === void 0 ? MessageRepliesCountButton_1.MessageRepliesCountButton : _q, _r = _f.MessageStatus, MessageStatus = _r === void 0 ? MessageStatus_1.MessageStatus : _r, _s = _f.MessageTimestamp, MessageTimestamp = _s === void 0 ? MessageTimestamp_1.MessageTimestamp : _s, _t = _f.ReactionsList, ReactionsList = _t === void 0 ? Reactions_1.ReactionsList : _t, _u = _f.ReminderNotification, ReminderNotification = _u === void 0 ? ReminderNotification_1.ReminderNotification : _u, _v = _f.StreamedMessageText, StreamedMessageText = _v === void 0 ? StreamedMessageText_1.StreamedMessageText : _v, PinIndicator = _f.PinIndicator;
    var hasAttachment = (0, utils_1.messageHasAttachments)(message);
    var hasReactions = (0, utils_1.messageHasReactions)(message);
    var isAIGenerated = (0, react_1.useMemo)(function () { return isMessageAIGenerated === null || isMessageAIGenerated === void 0 ? void 0 : isMessageAIGenerated(message); }, [isMessageAIGenerated, message]);
    if ((0, MessageList_1.isDateSeparatorMessage)(message)) {
        return null;
    }
    if (message.deleted_at || message.type === 'deleted') {
        return <MessageDeleted message={message}/>;
    }
    if ((0, utils_1.isMessageBlocked)(message)) {
        return <MessageBlocked />;
    }
    var showMetadata = !groupedByUser || endOfGroup;
    var showReplyCountButton = !threadList && !!message.reply_count;
    var showIsReplyInChannel = !threadList && message.show_in_channel && message.parent_id;
    var allowRetry = message.status === 'failed' && ((_a = message.error) === null || _a === void 0 ? void 0 : _a.status) !== 403;
    var isBounced = (0, utils_1.isMessageBounced)(message);
    var isEdited = (0, utils_1.isMessageEdited)(message) && !isAIGenerated;
    var handleClick = undefined;
    if (allowRetry) {
        handleClick = function () { return handleRetry(message); };
    }
    else if (isBounced) {
        handleClick = function () { return setIsBounceDialogOpen(true); };
    }
    else if (isEdited) {
        handleClick = function () { return setEditedTimestampOpen(function (prev) { return !prev; }); };
    }
    var rootClassName = (0, clsx_1.default)('str-chat__message str-chat__message-simple', "str-chat__message--".concat(message.type), "str-chat__message--".concat(message.status), isMyMessage()
        ? 'str-chat__message--me str-chat__message-simple--me'
        : 'str-chat__message--other', message.text ? 'str-chat__message--has-text' : 'has-no-text', {
        'str-chat__message--has-attachment': hasAttachment,
        'str-chat__message--highlighted': highlighted,
        'str-chat__message--pinned pinned-message': message.pinned,
        'str-chat__message--with-reactions': hasReactions,
        'str-chat__message-send-can-be-retried': (message === null || message === void 0 ? void 0 : message.status) === 'failed' && ((_b = message === null || message === void 0 ? void 0 : message.error) === null || _b === void 0 ? void 0 : _b.status) !== 403,
        'str-chat__message-with-thread-link': showReplyCountButton || showIsReplyInChannel,
        'str-chat__virtual-message__wrapper--end': endOfGroup,
        'str-chat__virtual-message__wrapper--first': firstOfGroup,
        'str-chat__virtual-message__wrapper--group': groupedByUser,
    });
    var poll = message.poll_id &&
        /* TODO backend-wire-up: polls.fromState */ undefined;
    return (<>
      {editing && (<MessageInput_1.EditMessageModal additionalMessageInputProps={additionalMessageInputProps}/>)}
      {isBounceDialogOpen && (<MessageBounceModal_1.MessageBounceModal MessageBouncePrompt={MessageBouncePrompt} onClose={function () { return setIsBounceDialogOpen(false); }} open={isBounceDialogOpen}/>)}
      {<div className={rootClassName} key={message.id}>
          {PinIndicator && <PinIndicator />}
          {!!reminder && <ReminderNotification reminder={reminder}/>}
          {message.user && (<Avatar image={message.user.image} name={message.user.name || message.user.id} onClick={onUserClick} onMouseOver={onUserHover} user={message.user}/>)}
          <div className={(0, clsx_1.default)('str-chat__message-inner', {
                'str-chat__simple-message--error-failed': allowRetry || isBounced,
            })} data-testid='message-inner' onClick={handleClick} onKeyUp={handleClick}>
            <MessageActions />
            <div className='str-chat__message-reactions-host'>
              {hasReactions && <ReactionsList reverse/>}
            </div>
            <div className='str-chat__message-bubble'>
              {poll && <Poll_1.Poll poll={poll}/>}
              {((_c = message.attachments) === null || _c === void 0 ? void 0 : _c.length) && !message.quoted_message ? (<Attachment actionHandler={handleAction} attachments={message.attachments}/>) : null}
              {isAIGenerated ? (<StreamedMessageText message={message} renderText={renderText}/>) : (<MessageText_1.MessageText message={message} renderText={renderText}/>)}
              <icons_1.MessageErrorIcon />
            </div>
          </div>
          {showReplyCountButton && (<MessageRepliesCountButton onClick={handleOpenThread} reply_count={message.reply_count}/>)}
          {showIsReplyInChannel && <MessageIsThreadReplyInChannelButtonIndicator />}
          {showMetadata && (<div className='str-chat__message-metadata'>
              <MessageStatus />
              {!isMyMessage() && !!message.user && (<span className='str-chat__message-simple-name'>
                  {message.user.name || message.user.id}
                </span>)}
              <MessageTimestamp customClass='str-chat__message-simple-timestamp'/>
              {isEdited && (<span className='str-chat__mesage-simple-edited'>{t('Edited')}</span>)}
              {isEdited && (<MessageEditedTimestamp_1.MessageEditedTimestamp calendar open={isEditedTimestampOpen}/>)}
            </div>)}
        </div>}
    </>);
};
var MemoizedMessageSimple = react_1.default.memo(MessageSimpleWithContext, utils_1.areMessageUIPropsEqual);
/**
 * The default UI component that renders a message and receives functionality and logic from the MessageContext.
 */
var MessageSimple = function (props) {
    var messageContext = (0, MessageContext_1.useMessageContext)('MessageSimple');
    return <MemoizedMessageSimple {...messageContext} {...props}/>;
};
exports.MessageSimple = MessageSimple;
