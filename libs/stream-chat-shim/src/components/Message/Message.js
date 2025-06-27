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
exports.Message = void 0;
var react_1 = require("react");
// import {
//   useActionHandler,
//   useDeleteHandler,
//   useEditHandler,
//   useFlagHandler,
//   useMarkUnreadHandler,
//   useMentionsHandler,
//   useMuteHandler,
//   useOpenThreadHandler,
//   usePinHandler,
//   useReactionHandler,
//   useReactionsFetcher,
//   useRetryHandler,
//   useUserHandler,
//   useUserRole,
var useActionHandler = function () { return (function () { return undefined; }); };
var useDeleteHandler = function () { return (function () { return undefined; }); };
var useEditHandler = function () { return ({ clearEdit: function () { }, editing: false, setEdit: function () { } }); };
var useFlagHandler = function () { return (function () { return undefined; }); };
var useMarkUnreadHandler = function () { return (function () { return undefined; }); };
var useMentionsHandler = function () { return ({ onMentionsClick: function () { }, onMentionsHover: function () { } }); };
var useMuteHandler = function () { return (function () { return undefined; }); };
var useOpenThreadHandler = function () { return (function () { return undefined; }); };
var usePinHandler = function () { return ({ canPin: false, handlePin: function () { } }); };
var useReactionHandler = function () { return (function () { return undefined; }); };
var useReactionsFetcher = function () { return (function () { return undefined; }); };
var useRetryHandler = function () { return (function () { return undefined; }); };
var useUserHandler = function () { return ({ onUserClick: function () { }, onUserHover: function () { } }); };
var useUserRole = function () { return ({}); };
var areMessagePropsEqual = function () { return false; };
var getMessageActions = function () { return []; };
var MESSAGE_ACTIONS = {};
// import {
//   MessageProvider,
//   useChannelActionContext,
//   useChannelStateContext,
//   useChatContext,
//   useComponentContext,
var MessageProvider = function (props) { return <>{props.children}</>; };
var useChannelActionContext = function () { return ({}); };
var useChannelStateContext = function () { return ({}); };
var useChatContext = function () { return ({}); };
var useComponentContext = function () { return ({}); };
var DefaultMessage = function () { return null; };
var MessageWithContext = function (props) {
    var _a;
    var canPin = props.canPin, groupedByUser = props.groupedByUser, propMessage = props.Message, message = props.message, _b = props.messageActions, messageActions = _b === void 0 ? Object.keys(MESSAGE_ACTIONS) : _b, propOnUserClick = props.onUserClick, propOnUserHover = props.onUserHover, userRoles = props.userRoles;
    var _c = useChatContext('Message'), client = _c.client, isMessageAIGenerated = _c.isMessageAIGenerated;
    var _d = useChannelStateContext('Message'), channelConfig = _d.channelConfig, read = _d.read;
    var contextMessage = useComponentContext('Message').Message;
    var actionsEnabled = message.type === 'regular' && message.status === 'received';
    var MessageUIComponent = (_a = propMessage !== null && propMessage !== void 0 ? propMessage : contextMessage) !== null && _a !== void 0 ? _a : DefaultMessage;
    var _e = useEditHandler(), clearEdit = _e.clearEdit, editing = _e.editing, setEdit = _e.setEdit;
    var _f = useUserHandler(message, {
        onUserClickHandler: propOnUserClick,
        onUserHoverHandler: propOnUserHover,
    }), onUserClick = _f.onUserClick, onUserHover = _f.onUserHover;
    var canDelete = userRoles.canDelete, canEdit = userRoles.canEdit, canFlag = userRoles.canFlag, canMarkUnread = userRoles.canMarkUnread, canMute = userRoles.canMute, canQuote = userRoles.canQuote, canReact = userRoles.canReact, canReply = userRoles.canReply, isMyMessage = userRoles.isMyMessage;
    var messageIsUnread = (0, react_1.useMemo)(function () {
        var _a;
        return !!(!isMyMessage &&
            ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id) &&
            read &&
            (!read[client.user.id] ||
                ((message === null || message === void 0 ? void 0 : message.created_at) &&
                    new Date(message.created_at).getTime() >
                        read[client.user.id].last_read.getTime())));
    }, [client, isMyMessage, message.created_at, read]);
    var messageActionsHandler = (0, react_1.useCallback)(function () {
        return getMessageActions(messageActions, {
            canDelete: canDelete,
            canEdit: canEdit,
            canFlag: canFlag,
            canMarkUnread: canMarkUnread,
            canMute: canMute,
            canPin: canPin,
            canQuote: canQuote,
            canReact: canReact,
            canReply: canReply,
        }, channelConfig);
    }, [
        messageActions,
        canDelete,
        canEdit,
        canFlag,
        canMarkUnread,
        canMute,
        canPin,
        canQuote,
        canReact,
        canReply,
        channelConfig,
    ]);
    var canPinPropToNotPass = props.canPin, // eslint-disable-line @typescript-eslint/no-unused-vars
    messageActionsPropToNotPass = props.messageActions, // eslint-disable-line @typescript-eslint/no-unused-vars
    onlySenderCanEditPropToNotPass = props.onlySenderCanEdit, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserClickPropToNotPass = props.onUserClick, // eslint-disable-line @typescript-eslint/no-unused-vars
    onUserHoverPropToNotPass = props.onUserHover, // eslint-disable-line @typescript-eslint/no-unused-vars
    userRolesPropToNotPass = props.userRoles, // eslint-disable-line @typescript-eslint/no-unused-vars
    rest = __rest(props, ["canPin", "messageActions", "onlySenderCanEdit", "onUserClick", "onUserHover", "userRoles"]);
    var messageContextValue = __assign(__assign({}, rest), { actionsEnabled: actionsEnabled, clearEditingState: clearEdit, editing: editing, getMessageActions: messageActionsHandler, handleEdit: setEdit, isMessageAIGenerated: isMessageAIGenerated, isMyMessage: function () { return isMyMessage; }, messageIsUnread: messageIsUnread, onUserClick: onUserClick, onUserHover: onUserHover, setEditingState: setEdit });
    return (<MessageProvider value={messageContextValue}>
      <MessageUIComponent groupedByUser={groupedByUser}/>
      {/* TODO - remove prop in next major release, maintains VML backwards compatibility */}
    </MessageProvider>);
};
var MemoizedMessage = react_1.default.memo(MessageWithContext, areMessagePropsEqual);
/**
 * The Message component is a context provider which implements all the logic required for rendering
 * an individual message. The actual UI of the message is delegated via the Message prop on Channel.
 */
var Message = function (props) {
    var closeReactionSelectorOnClick = props.closeReactionSelectorOnClick, disableQuotedMessages = props.disableQuotedMessages, getDeleteMessageErrorNotification = props.getDeleteMessageErrorNotification, getFetchReactionsErrorNotification = props.getFetchReactionsErrorNotification, getFlagMessageErrorNotification = props.getFlagMessageErrorNotification, getFlagMessageSuccessNotification = props.getFlagMessageSuccessNotification, getMarkMessageUnreadErrorNotification = props.getMarkMessageUnreadErrorNotification, getMarkMessageUnreadSuccessNotification = props.getMarkMessageUnreadSuccessNotification, getMuteUserErrorNotification = props.getMuteUserErrorNotification, getMuteUserSuccessNotification = props.getMuteUserSuccessNotification, getPinMessageErrorNotification = props.getPinMessageErrorNotification, message = props.message, _a = props.onlySenderCanEdit, onlySenderCanEdit = _a === void 0 ? false : _a, propOnMentionsClick = props.onMentionsClick, propOnMentionsHover = props.onMentionsHover, propOpenThread = props.openThread, pinPermissions = props.pinPermissions, reactionDetailsSort = props.reactionDetailsSort, propRetrySendMessage = props.retrySendMessage, sortReactionDetails = props.sortReactionDetails, sortReactions = props.sortReactions;
    var addNotification = useChannelActionContext('Message').addNotification;
    var _b = useChannelStateContext('Message'), highlightedMessageId = _b.highlightedMessageId, mutes = _b.mutes;
    var handleAction = useActionHandler(message);
    var handleOpenThread = useOpenThreadHandler(message, propOpenThread);
    var handleReaction = useReactionHandler(message);
    var handleRetry = useRetryHandler(propRetrySendMessage);
    var userRoles = useUserRole(message, onlySenderCanEdit, disableQuotedMessages);
    var handleFetchReactions = useReactionsFetcher(message, {
        getErrorNotification: getFetchReactionsErrorNotification,
        notify: addNotification,
    });
    var handleDelete = useDeleteHandler(message, {
        getErrorNotification: getDeleteMessageErrorNotification,
        notify: addNotification,
    });
    var handleFlag = useFlagHandler(message, {
        getErrorNotification: getFlagMessageErrorNotification,
        getSuccessNotification: getFlagMessageSuccessNotification,
        notify: addNotification,
    });
    var handleMarkUnread = useMarkUnreadHandler(message, {
        getErrorNotification: getMarkMessageUnreadErrorNotification,
        getSuccessNotification: getMarkMessageUnreadSuccessNotification,
        notify: addNotification,
    });
    var handleMute = useMuteHandler(message, {
        getErrorNotification: getMuteUserErrorNotification,
        getSuccessNotification: getMuteUserSuccessNotification,
        notify: addNotification,
    });
    var _c = useMentionsHandler(message, {
        onMentionsClick: propOnMentionsClick,
        onMentionsHover: propOnMentionsHover,
    }), onMentionsClick = _c.onMentionsClick, onMentionsHover = _c.onMentionsHover;
    var _d = usePinHandler(message, pinPermissions, {
        getErrorNotification: getPinMessageErrorNotification,
        notify: addNotification,
    }), canPin = _d.canPin, handlePin = _d.handlePin;
    var highlighted = highlightedMessageId === message.id;
    return (<MemoizedMessage additionalMessageInputProps={props.additionalMessageInputProps} autoscrollToBottom={props.autoscrollToBottom} canPin={canPin} closeReactionSelectorOnClick={closeReactionSelectorOnClick} customMessageActions={props.customMessageActions} disableQuotedMessages={props.disableQuotedMessages} endOfGroup={props.endOfGroup} firstOfGroup={props.firstOfGroup} formatDate={props.formatDate} groupedByUser={props.groupedByUser} groupStyles={props.groupStyles} handleAction={handleAction} handleDelete={handleDelete} handleFetchReactions={handleFetchReactions} handleFlag={handleFlag} handleMarkUnread={handleMarkUnread} handleMute={handleMute} handleOpenThread={handleOpenThread} handlePin={handlePin} handleReaction={handleReaction} handleRetry={handleRetry} highlighted={highlighted} initialMessage={props.initialMessage} lastReceivedId={props.lastReceivedId} message={message} Message={props.Message} messageActions={props.messageActions} messageListRect={props.messageListRect} mutes={mutes} onMentionsClickMessage={onMentionsClick} onMentionsHoverMessage={onMentionsHover} onUserClick={props.onUserClick} onUserHover={props.onUserHover} pinPermissions={props.pinPermissions} reactionDetailsSort={reactionDetailsSort} readBy={props.readBy} renderText={props.renderText} sortReactionDetails={sortReactionDetails} sortReactions={sortReactions} threadList={props.threadList} unsafeHTML={props.unsafeHTML} userRoles={userRoles}/>);
};
exports.Message = Message;
