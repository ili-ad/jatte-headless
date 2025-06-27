"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageActionsWrapper = exports.MessageActions = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var MessageActionsBox_1 = require("./MessageActionsBox");
var Dialog_1 = require("../Dialog");
var icons_1 = require("../Message/icons");
var isUserMuted = function () { return false; };
var shouldRenderMessageActions = function () { return false; };
var ChatContext_1 = require("../../context/ChatContext");
var MessageContext_1 = require("../../context/MessageContext");
var context_1 = require("../../context");
var MessageActions = function (props) {
    var _a = props.ActionsIcon, ActionsIcon = _a === void 0 ? icons_1.ActionsIcon : _a, _b = props.customWrapperClass, customWrapperClass = _b === void 0 ? '' : _b, propGetMessageActions = props.getMessageActions, propHandleDelete = props.handleDelete, propHandleFlag = props.handleFlag, propHandleMarkUnread = props.handleMarkUnread, propHandleMute = props.handleMute, propHandlePin = props.handlePin, inline = props.inline, propMessage = props.message, mine = props.mine;
    var mutes = (0, ChatContext_1.useChatContext)('MessageActions').mutes;
    var _c = (0, MessageContext_1.useMessageContext)('MessageActions'), customMessageActions = _c.customMessageActions, contextGetMessageActions = _c.getMessageActions, contextHandleDelete = _c.handleDelete, contextHandleFlag = _c.handleFlag, contextHandleMarkUnread = _c.handleMarkUnread, contextHandleMute = _c.handleMute, contextHandlePin = _c.handlePin, isMyMessage = _c.isMyMessage, contextMessage = _c.message, setEditingState = _c.setEditingState, threadList = _c.threadList;
    var CustomMessageActionsList = (0, context_1.useComponentContext)('MessageActions').CustomMessageActionsList;
    var t = (0, context_1.useTranslationContext)('MessageActions').t;
    var getMessageActions = propGetMessageActions || contextGetMessageActions;
    var handleDelete = propHandleDelete || contextHandleDelete;
    var handleFlag = propHandleFlag || contextHandleFlag;
    var handleMarkUnread = propHandleMarkUnread || contextHandleMarkUnread;
    var handleMute = propHandleMute || contextHandleMute;
    var handlePin = propHandlePin || contextHandlePin;
    var message = propMessage || contextMessage;
    var isMine = mine ? mine() : isMyMessage();
    var isMuted = (0, react_1.useCallback)(function () { return isUserMuted(message, mutes); }, [message, mutes]);
    var dialogId = "message-actions--".concat(message.id);
    var dialog = (0, Dialog_1.useDialog)({ id: dialogId });
    var dialogIsOpen = (0, Dialog_1.useDialogIsOpen)(dialogId);
    var messageActions = getMessageActions();
    var renderMessageActions = shouldRenderMessageActions({
        customMessageActions: customMessageActions,
        CustomMessageActionsList: CustomMessageActionsList,
        inThread: threadList,
        messageActions: messageActions,
    });
    var actionsBoxButtonRef = (0, react_1.useRef)(null);
    if (!renderMessageActions)
        return null;
    return (<exports.MessageActionsWrapper customWrapperClass={customWrapperClass} inline={inline} toggleOpen={dialog === null || dialog === void 0 ? void 0 : dialog.toggle}>
      <Dialog_1.DialogAnchor id={dialogId} placement={isMine ? 'top-end' : 'top-start'} referenceElement={actionsBoxButtonRef.current} tabIndex={-1} trapFocus>
        <MessageActionsBox_1.MessageActionsBox getMessageActions={getMessageActions} handleDelete={handleDelete} handleEdit={setEditingState} handleFlag={handleFlag} handleMarkUnread={handleMarkUnread} handleMute={handleMute} handlePin={handlePin} isUserMuted={isMuted} mine={isMine} open={dialogIsOpen}/>
      </Dialog_1.DialogAnchor>
      <button aria-expanded={dialogIsOpen} aria-haspopup='true' aria-label={t('aria/Open Message Actions Menu')} className='str-chat__message-actions-box-button' data-testid='message-actions-toggle-button' ref={actionsBoxButtonRef}>
        <ActionsIcon className='str-chat__message-action-icon'/>
      </button>
    </exports.MessageActionsWrapper>);
};
exports.MessageActions = MessageActions;
var MessageActionsWrapper = function (props) {
    var children = props.children, customWrapperClass = props.customWrapperClass, inline = props.inline, toggleOpen = props.toggleOpen;
    var defaultWrapperClass = (0, clsx_1.default)('str-chat__message-simple__actions__action', 'str-chat__message-simple__actions__action--options', 'str-chat__message-actions-container');
    var wrapperProps = {
        className: customWrapperClass || defaultWrapperClass,
        'data-testid': 'message-actions',
        onClick: toggleOpen,
    };
    if (inline)
        return <span {...wrapperProps}>{children}</span>;
    return <div {...wrapperProps}>{children}</div>;
};
exports.MessageActionsWrapper = MessageActionsWrapper;
