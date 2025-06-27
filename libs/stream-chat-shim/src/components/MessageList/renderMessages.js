"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRenderMessages = defaultRenderMessages;
var react_1 = require("react");
var getIsFirstUnreadMessage = function () { return false; }; // temporary shim
var isDateSeparatorMessage = function () { return false; }; // temporary shim
var isIntroMessage = function () { return false; }; // temporary shim
var Message_1 = require("../Message");
var DateSeparator_1 = require("../DateSeparator");
var EventComponent_1 = require("../EventComponent");
var DefaultUnreadMessagesSeparator = (function () { return null; }); // temporary shim
function defaultRenderMessages(_a) {
    var channelUnreadUiState = _a.channelUnreadUiState, components = _a.components, customClasses = _a.customClasses, lastReceivedId = _a.lastReceivedMessageId, messageGroupStyles = _a.messageGroupStyles, messages = _a.messages, readData = _a.readData, messageProps = _a.sharedMessageProps;
    var _b = components, _c = _b.DateSeparator, DateSeparator = _c === void 0 ? DateSeparator_1.DateSeparator : _c, HeaderComponent = _b.HeaderComponent, _d = _b.MessageSystem, MessageSystem = _d === void 0 ? EventComponent_1.EventComponent : _d, _e = _b.UnreadMessagesSeparator, UnreadMessagesSeparator = _e === void 0 ? DefaultUnreadMessagesSeparator : _e;
    var renderedMessages = [];
    var firstMessage;
    var previousMessage = undefined;
    for (var index = 0; index < messages.length; index++) {
        var message = messages[index];
        if (isDateSeparatorMessage(message)) {
            renderedMessages.push(<li key={"".concat(message.date.toISOString(), "-i")}>
          <DateSeparator date={message.date} formatDate={messageProps.formatDate} unread={message.unread}/>
        </li>);
        }
        else if (isIntroMessage(message)) {
            if (HeaderComponent) {
                renderedMessages.push(<li key='intro'>
            <HeaderComponent />
          </li>);
            }
        }
        else if (message.type === 'system') {
            renderedMessages.push(<li data-message-id={message.id} key={message.id || message.created_at.toISOString()}>
          <MessageSystem message={message}/>
        </li>);
        }
        else {
            if (!firstMessage) {
                firstMessage = message;
            }
            var groupStyles = messageGroupStyles[message.id] || '';
            var messageClass = (customClasses === null || customClasses === void 0 ? void 0 : customClasses.message) || "str-chat__li str-chat__li--".concat(groupStyles);
            var isFirstUnreadMessage = getIsFirstUnreadMessage({
                firstUnreadMessageId: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.first_unread_message_id,
                isFirstMessage: !!(firstMessage === null || firstMessage === void 0 ? void 0 : firstMessage.id) && firstMessage.id === message.id,
                lastReadDate: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.last_read,
                lastReadMessageId: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.last_read_message_id,
                message: message,
                previousMessage: previousMessage,
                unreadMessageCount: channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages,
            });
            renderedMessages.push(<react_1.Fragment key={message.id || message.created_at.toISOString()}>
          {isFirstUnreadMessage && UnreadMessagesSeparator && (<li className='str-chat__li str-chat__unread-messages-separator-wrapper'>
              <UnreadMessagesSeparator unreadCount={channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages}/>
            </li>)}
          <li className={messageClass} data-message-id={message.id} data-testid={messageClass}>
            <Message_1.Message groupStyles={[groupStyles]} /* TODO: convert to simple string */ lastReceivedId={lastReceivedId} message={message} readBy={readData[message.id] || []} {...messageProps}/>
          </li>
        </react_1.Fragment>);
            previousMessage = message;
        }
    }
    return renderedMessages;
}
