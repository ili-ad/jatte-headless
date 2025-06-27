"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypingIndicator = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
var ChatContext_1 = require("../../context/ChatContext");
var TypingContext_1 = require("../../context/TypingContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var useJoinTypingUsers = function (names) {
    var t = (0, TranslationContext_1.useTranslationContext)().t;
    if (!names.length)
        return null;
    var name = names[0], rest = names.slice(1);
    if (names.length === 1)
        return t('{{ user }} is typing...', {
            user: name,
        });
    var MAX_JOINED_USERS = 3;
    if (names.length > MAX_JOINED_USERS)
        return t('{{ users }} and more are typing...', {
            users: names.slice(0, MAX_JOINED_USERS).join(', ').trim(),
        });
    return t('{{ users }} and {{ user }} are typing...', {
        user: name,
        users: rest.join(', ').trim(),
    });
};
/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 */
var UnMemoizedTypingIndicator = function (props) {
    var threadList = props.threadList;
    var _a = (0, ChannelStateContext_1.useChannelStateContext)('TypingIndicator'), channelConfig = _a.channelConfig, thread = _a.thread;
    var client = (0, ChatContext_1.useChatContext)('TypingIndicator').client;
    var _b = (0, TypingContext_1.useTypingContext)('TypingIndicator').typing, typing = _b === void 0 ? {} : _b;
    var typingInChannel = !threadList
        ? Object.values(typing).filter(function (_a) {
            var _b;
            var parent_id = _a.parent_id, user = _a.user;
            return (user === null || user === void 0 ? void 0 : user.id) !== ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id) && !parent_id;
        })
        : [];
    var typingInThread = threadList
        ? Object.values(typing).filter(function (_a) {
            var _b;
            var parent_id = _a.parent_id, user = _a.user;
            return (user === null || user === void 0 ? void 0 : user.id) !== ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id) && parent_id === (thread === null || thread === void 0 ? void 0 : thread.id);
        })
        : [];
    var typingUserList = (threadList ? typingInThread : typingInChannel)
        .map(function (_a) {
        var user = _a.user;
        return (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.id);
    })
        .filter(Boolean);
    var joinedTypingUsers = useJoinTypingUsers(typingUserList);
    var isTypingActive = (threadList && typingInThread.length) || (!threadList && typingInChannel.length);
    if ((channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.typing_events) === false) {
        return null;
    }
    if (!isTypingActive)
        return null;
    return (<div className={(0, clsx_1.default)('str-chat__typing-indicator', {
            'str-chat__typing-indicator--typing': isTypingActive,
        })} data-testid='typing-indicator'>
      <div className='str-chat__typing-indicator__dots'>
        <span className='str-chat__typing-indicator__dot'></span>
        <span className='str-chat__typing-indicator__dot'></span>
        <span className='str-chat__typing-indicator__dot'></span>
      </div>
      <div className='str-chat__typing-indicator__users' data-testid='typing-users'>
        {joinedTypingUsers}
      </div>
    </div>);
};
exports.TypingIndicator = react_1.default.memo(UnMemoizedTypingIndicator);
