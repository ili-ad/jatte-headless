"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageOptions = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var icons_1 = require("./icons");
var utils_1 = require("./utils");
var MessageActions_1 = require("../MessageActions");
var Dialog_1 = require("../Dialog");
var ReactionSelectorWithButton_1 = require("../Reactions/ReactionSelectorWithButton");
var context_1 = require("../../context");
var UnMemoizedMessageOptions = function (props) {
    var _a = props.ActionsIcon, ActionsIcon = _a === void 0 ? icons_1.ActionsIcon : _a, _b = props.displayReplies, displayReplies = _b === void 0 ? true : _b, propHandleOpenThread = props.handleOpenThread, _c = props.ReactionIcon, ReactionIcon = _c === void 0 ? icons_1.ReactionIcon : _c, _d = props.theme, theme = _d === void 0 ? 'simple' : _d, _e = props.ThreadIcon, ThreadIcon = _e === void 0 ? icons_1.ThreadIcon : _e;
    var _f = (0, context_1.useMessageContext)('MessageOptions'), getMessageActions = _f.getMessageActions, contextHandleOpenThread = _f.handleOpenThread, initialMessage = _f.initialMessage, message = _f.message, threadList = _f.threadList;
    var t = (0, context_1.useTranslationContext)('MessageOptions').t;
    var messageActionsDialogIsOpen = (0, Dialog_1.useDialogIsOpen)("message-actions--".concat(message.id));
    var reactionSelectorDialogIsOpen = (0, Dialog_1.useDialogIsOpen)("reaction-selector--".concat(message.id));
    var handleOpenThread = propHandleOpenThread || contextHandleOpenThread;
    var messageActions = getMessageActions();
    var shouldShowReactions = messageActions.indexOf(utils_1.MESSAGE_ACTIONS.react) > -1;
    var shouldShowReplies = messageActions.indexOf(utils_1.MESSAGE_ACTIONS.reply) > -1 && displayReplies && !threadList;
    if (!message.type ||
        message.type === 'error' ||
        message.type === 'system' ||
        message.type === 'ephemeral' ||
        message.status === 'failed' ||
        message.status === 'sending' ||
        initialMessage) {
        return null;
    }
    return (<div className={(0, clsx_1.default)("str-chat__message-".concat(theme, "__actions str-chat__message-options"), {
            'str-chat__message-options--active': messageActionsDialogIsOpen || reactionSelectorDialogIsOpen,
        })} data-testid='message-options'>
      <MessageActions_1.MessageActions ActionsIcon={ActionsIcon}/>
      {shouldShowReplies && (<button aria-label={t('aria/Open Thread')} className={"str-chat__message-".concat(theme, "__actions__action str-chat__message-").concat(theme, "__actions__action--thread str-chat__message-reply-in-thread-button")} data-testid='thread-action' onClick={handleOpenThread}>
          <ThreadIcon className='str-chat__message-action-icon'/>
        </button>)}
      {shouldShowReactions && <ReactionSelectorWithButton_1.ReactionSelectorWithButton ReactionIcon={ReactionIcon}/>}
    </div>);
};
exports.MessageOptions = react_1.default.memo(UnMemoizedMessageOptions);
