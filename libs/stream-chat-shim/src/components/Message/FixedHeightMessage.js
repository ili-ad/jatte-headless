"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedHeightMessage = void 0;
var react_1 = require("react");
var hooks_1 = require("./hooks");
var MessageDeleted_1 = require("./MessageDeleted");
var MessageTimestamp_1 = require("./MessageTimestamp");
var utils_1 = require("./utils");
var Avatar_1 = require("../Avatar");
var Gallery_1 = require("../Gallery");
var MessageActions_1 = require("../MessageActions");
var ChatContext_1 = require("../../context/ChatContext");
var ComponentContext_1 = require("../../context/ComponentContext");
var MessageContext_1 = require("../../context/MessageContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var renderText_1 = require("./renderText");
var selectColor = function (number, dark) {
    var hue = number * 137.508; // use golden angle approximation
    return "hsl(".concat(hue, ",").concat(dark ? '50%' : '85%', ", ").concat(dark ? '75%' : '55%', ")");
};
var hashUserId = function (userId) {
    var hash = userId.split('').reduce(function (acc, c) {
        acc = (acc << 5) - acc + c.charCodeAt(0);
        return acc & acc;
    }, 0);
    return Math.abs(hash) / Math.pow(10, Math.ceil(Math.log10(Math.abs(hash) + 1)));
};
var getUserColor = function (theme, userId) {
    return selectColor(hashUserId(userId), theme.includes('dark'));
};
var UnMemoizedFixedHeightMessage = function (props) {
    var _a, _b, _c, _d;
    var propGroupedByUser = props.groupedByUser, propMessage = props.message;
    var theme = (0, ChatContext_1.useChatContext)('FixedHeightMessage').theme;
    var _e = (0, MessageContext_1.useMessageContext)('FixedHeightMessage'), contextGroupedByUser = _e.groupedByUser, contextMessage = _e.message;
    var _f = (0, ComponentContext_1.useComponentContext)('FixedHeightMessage').MessageDeleted, MessageDeleted = _f === void 0 ? MessageDeleted_1.MessageDeleted : _f;
    var userLanguage = (0, TranslationContext_1.useTranslationContext)('FixedHeightMessage').userLanguage;
    var groupedByUser = propGroupedByUser !== undefined ? propGroupedByUser : contextGroupedByUser;
    var message = propMessage || contextMessage;
    var handleDelete = (0, hooks_1.useDeleteHandler)(message);
    var role = (0, hooks_1.useUserRole)(message);
    var messageTextToRender = ((_a = message === null || message === void 0 ? void 0 : message.i18n) === null || _a === void 0 ? void 0 : _a["".concat(userLanguage, "_text")]) ||
        (message === null || message === void 0 ? void 0 : message.text);
    var renderedText = (0, react_1.useMemo)(function () { return (0, renderText_1.renderText)(messageTextToRender, message.mentioned_users); }, [message.mentioned_users, messageTextToRender]);
    var userId = ((_b = message.user) === null || _b === void 0 ? void 0 : _b.id) || '';
    var userColor = (0, react_1.useMemo)(function () { return getUserColor(theme, userId); }, [userId, theme]);
    var messageActionsHandler = (0, react_1.useCallback)(function () { return (0, utils_1.getMessageActions)(['delete'], { canDelete: role.canDelete }); }, [role]);
    var images = (_c = message === null || message === void 0 ? void 0 : message.attachments) === null || _c === void 0 ? void 0 : _c.filter(function (_a) {
        var type = _a.type;
        return type === 'image';
    });
    return (<div className={"str-chat__virtual-message__wrapper ".concat(role.isMyMessage ? 'str-chat__virtual-message__wrapper--me' : '', " ").concat(groupedByUser ? 'str-chat__virtual-message__wrapper--group' : '')} key={message.id}>
      {message.user && (<Avatar_1.Avatar image={message.user.image} name={message.user.name || message.user.id} user={message.user}/>)}
      <div className='str-chat__virtual-message__content'>
        <div className='str-chat__virtual-message__meta'>
          <div className='str-chat__virtual-message__author' style={{ color: userColor }}>
            <strong>{((_d = message.user) === null || _d === void 0 ? void 0 : _d.name) || 'unknown'}</strong>
          </div>
        </div>
        {message.deleted_at || message.type === 'deleted' ? (<MessageDeleted message={message}/>) : (<>
            {images && <Gallery_1.Gallery images={images}/>}
            <div className='str-chat__virtual-message__text' data-testid='msg-text'>
              {renderedText}
              <div className='str-chat__virtual-message__data'>
                <MessageActions_1.MessageActions customWrapperClass='str-chat__virtual-message__actions' getMessageActions={messageActionsHandler} handleDelete={handleDelete} message={message} mine={function () { return role.isMyMessage; }}/>
                <span className='str-chat__virtual-message__date'>
                  <MessageTimestamp_1.MessageTimestamp customClass='str-chat__message-simple-timestamp' message={message}/>
                </span>
              </div>
            </div>
          </>)}
      </div>
    </div>);
};
/**
 * @deprecated - This UI component will be removed in the next major release.
 *
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 */
exports.FixedHeightMessage = react_1.default.memo(UnMemoizedFixedHeightMessage);
