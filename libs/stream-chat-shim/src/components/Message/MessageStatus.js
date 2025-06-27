"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStatus = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var icons_1 = require("./icons");
var utils_1 = require("./utils");
var Avatar_1 = require("../Avatar");
var Loading_1 = require("../Loading");
var Tooltip_1 = require("../Tooltip");
var hooks_1 = require("../Tooltip/hooks");
var ChatContext_1 = require("../../context/ChatContext");
var ComponentContext_1 = require("../../context/ComponentContext");
var MessageContext_1 = require("../../context/MessageContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var UnMemoizedMessageStatus = function (props) {
    var _a;
    var propAvatar = props.Avatar, MessageDeliveredStatus = props.MessageDeliveredStatus, MessageReadStatus = props.MessageReadStatus, MessageSendingStatus = props.MessageSendingStatus, _b = props.messageType, messageType = _b === void 0 ? 'simple' : _b, _c = props.tooltipUserNameMapper, tooltipUserNameMapper = _c === void 0 ? utils_1.mapToUserNameOrId : _c;
    var _d = (0, hooks_1.useEnterLeaveHandlers)(), handleEnter = _d.handleEnter, handleLeave = _d.handleLeave, tooltipVisible = _d.tooltipVisible;
    var client = (0, ChatContext_1.useChatContext)('MessageStatus').client;
    var contextAvatar = (0, ComponentContext_1.useComponentContext)('MessageStatus').Avatar;
    var _e = (0, MessageContext_1.useMessageContext)('MessageStatus'), isMyMessage = _e.isMyMessage, lastReceivedId = _e.lastReceivedId, message = _e.message, readBy = _e.readBy, threadList = _e.threadList;
    var t = (0, TranslationContext_1.useTranslationContext)('MessageStatus').t;
    var _f = (0, react_1.useState)(null), referenceElement = _f[0], setReferenceElement = _f[1];
    var Avatar = propAvatar || contextAvatar || Avatar_1.Avatar;
    if (!isMyMessage() || message.type === 'error')
        return null;
    var justReadByMe = (readBy === null || readBy === void 0 ? void 0 : readBy.length) === 1 && readBy[0].id === ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id);
    var rootClassName = "str-chat__message-".concat(messageType, "-status str-chat__message-status");
    var sending = message.status === 'sending';
    var delivered = message.status === 'received' && message.id === lastReceivedId && !threadList;
    var deliveredAndRead = !!((readBy === null || readBy === void 0 ? void 0 : readBy.length) && !threadList && !justReadByMe);
    var readersWithoutOwnUser = deliveredAndRead
        ? readBy.filter(function (item) { var _a; return item.id !== ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); })
        : [];
    var lastReadUser = readersWithoutOwnUser[0];
    return (<span className={rootClassName} data-testid={(0, clsx_1.default)({
            'message-status-read-by': deliveredAndRead,
            'message-status-received': delivered && !deliveredAndRead,
            'message-status-sending': sending,
        })} onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={setReferenceElement}>
      {sending &&
            (MessageSendingStatus ? (<MessageSendingStatus />) : (<>
            <Tooltip_1.PopperTooltip offset={[0, 5]} referenceElement={referenceElement} visible={tooltipVisible}>
              {t('Sending...')}
            </Tooltip_1.PopperTooltip>
            <Loading_1.LoadingIndicator />
          </>))}

      {delivered &&
            !deliveredAndRead &&
            (MessageDeliveredStatus ? (<MessageDeliveredStatus />) : (<>
            <Tooltip_1.PopperTooltip offset={[0, 5]} referenceElement={referenceElement} visible={tooltipVisible}>
              {t('Delivered')}
            </Tooltip_1.PopperTooltip>
            <icons_1.MessageDeliveredIcon />
          </>))}

      {deliveredAndRead &&
            (MessageReadStatus ? (<MessageReadStatus />) : (<>
            <Tooltip_1.PopperTooltip offset={[0, 5]} referenceElement={referenceElement} visible={tooltipVisible}>
              {(0, utils_1.getReadByTooltipText)(readBy, t, client, tooltipUserNameMapper)}
            </Tooltip_1.PopperTooltip>

            <Avatar className='str-chat__avatar--message-status' image={lastReadUser.image} name={lastReadUser.name || lastReadUser.id} user={lastReadUser}/>

            {readersWithoutOwnUser.length > 1 && (<span className={"str-chat__message-".concat(messageType, "-status-number")} data-testid='message-status-read-by-many'>
                {readersWithoutOwnUser.length}
              </span>)}
          </>))}
    </span>);
};
exports.MessageStatus = react_1.default.memo(UnMemoizedMessageStatus);
