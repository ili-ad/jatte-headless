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
exports.MessageActionsBox = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var CustomMessageActionsList_1 = require("./CustomMessageActionsList");
var RemindMeSubmenu_1 = require("./RemindMeSubmenu");
var useMessageReminder = function () {
    var _args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _args[_i] = arguments[_i];
    }
    return ({});
};
var useMessageComposer = function () { return ({ setQuotedMessage: function (_m) { } }); };
// import {
//   useChatContext,
//   useComponentContext,
//   useMessageContext,
//   useTranslationContext,
var useChatContext = function () { return ({ client: {} }); };
var useComponentContext = function (_) { return ({}); };
var useMessageContext = function (_) { return ({ customMessageActions: undefined, message: {}, threadList: false }); };
var useTranslationContext = function (_) { return ({ t: function (key) { return key; } }); };
var MESSAGE_ACTIONS = {
    delete: 'delete',
    edit: 'edit',
    flag: 'flag',
    markUnread: 'markUnread',
    mute: 'mute',
    pin: 'pin',
    quote: 'quote',
    react: 'react',
    remindMe: 'remindMe',
    reply: 'reply',
    saveForLater: 'saveForLater',
};
var UnMemoizedMessageActionsBox = function (props) {
    var className = props.className, getMessageActions = props.getMessageActions, handleDelete = props.handleDelete, handleEdit = props.handleEdit, handleFlag = props.handleFlag, handleMarkUnread = props.handleMarkUnread, handleMute = props.handleMute, handlePin = props.handlePin, isUserMuted = props.isUserMuted, mine = props.mine, open = props.open, restDivProps = __rest(props, ["className", "getMessageActions", "handleDelete", "handleEdit", "handleFlag", "handleMarkUnread", "handleMute", "handlePin", "isUserMuted", "mine", "open"]);
    var client = useChatContext().client;
    var _a = useComponentContext('MessageActionsBox').CustomMessageActionsList, CustomMessageActionsList = _a === void 0 ? CustomMessageActionsList_1.CustomMessageActionsList : _a;
    var _b = useMessageContext('MessageActionsBox'), customMessageActions = _b.customMessageActions, message = _b.message, threadList = _b.threadList;
    var t = useTranslationContext('MessageActionsBox').t;
    var messageComposer = useMessageComposer();
    var reminder = useMessageReminder(message.id);
    var messageActions = getMessageActions();
    var handleQuote = function () {
        messageComposer.setQuotedMessage(message);
        var elements = message.parent_id
            ? document.querySelectorAll('.str-chat__thread .str-chat__textarea__textarea')
            : document.getElementsByClassName('str-chat__textarea__textarea');
        var textarea = elements.item(0);
        if (textarea instanceof HTMLTextAreaElement) {
            textarea.focus();
        }
    };
    var rootClassName = (0, clsx_1.default)('str-chat__message-actions-box', className, {
        'str-chat__message-actions-box--open': open,
    });
    var buttonClassName = 'str-chat__message-actions-list-item str-chat__message-actions-list-item-button';
    return (<div {...restDivProps} className={rootClassName} data-testid='message-actions-box'>
      <div aria-label={t('aria/Message Options')} className='str-chat__message-actions-list' role='listbox'>
        <CustomMessageActionsList customMessageActions={customMessageActions} message={message}/>
        {messageActions.indexOf(MESSAGE_ACTIONS.quote) > -1 && (<button aria-selected='false' className={buttonClassName} onClick={handleQuote} role='option'>
            {t('Reply')}
          </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1 && !message.parent_id && (<button aria-selected='false' className={buttonClassName} onClick={handlePin} role='option'>
            {!message.pinned ? t('Pin') : t('Unpin')}
          </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.markUnread) > -1 &&
            !threadList &&
            !!message.id && (<button aria-selected='false' className={buttonClassName} onClick={handleMarkUnread} role='option'>
              {t('Mark as unread')}
            </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && (<button aria-selected='false' className={buttonClassName} onClick={handleFlag} role='option'>
            {t('Flag')}
          </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && (<button aria-selected='false' className={buttonClassName} onClick={handleMute} role='option'>
            {isUserMuted() ? t('Unmute') : t('Mute')}
          </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && (<button aria-selected='false' className={buttonClassName} onClick={handleEdit} role='option'>
            {t('Edit Message')}
          </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && (<button aria-selected='false' className={buttonClassName} onClick={handleDelete} role='option'>
            {t('Delete')}
          </button>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.remindMe) > -1 && (<RemindMeSubmenu_1.RemindMeActionButton className={buttonClassName} isMine={mine}/>)}
        {messageActions.indexOf(MESSAGE_ACTIONS.saveForLater) > -1 && (<button aria-selected='false' className={buttonClassName} onClick={function () {
                return reminder;
            }} role='option'>
            {reminder ? t('Remove reminder') : t('Save for later')}
          </button>)}
      </div>
    </div>);
};
/**
 * A popup box that displays the available actions on a message, such as edit, delete, pin, etc.
 */
exports.MessageActionsBox = react_1.default.memo(UnMemoizedMessageActionsBox);
