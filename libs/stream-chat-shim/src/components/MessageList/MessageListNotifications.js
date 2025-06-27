"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageListNotifications = void 0;
var react_1 = require("react");
var ConnectionStatus_1 = require("./ConnectionStatus");
var CustomNotification_1 = require("./CustomNotification");
var TranslationContext_1 = require("../../context/TranslationContext");
var useNotifications_1 = require("../Notifications/hooks/useNotifications");
var ClientNotifications = function () {
    var clientNotifications = (0, useNotifications_1.useNotifications)();
    var t = (0, TranslationContext_1.useTranslationContext)().t;
    return (<>
      {clientNotifications.map(function (notification) { return (<CustomNotification_1.CustomNotification active={true} key={notification.id} type={notification.severity}>
          {t('translationBuilderTopic/notification', { notification: notification })}
        </CustomNotification_1.CustomNotification>); })}
    </>);
};
var MessageListNotifications = function (props) {
    var hasNewMessages = props.hasNewMessages, isMessageListScrolledToBottom = props.isMessageListScrolledToBottom, isNotAtLatestMessageSet = props.isNotAtLatestMessageSet, MessageNotification = props.MessageNotification, notifications = props.notifications, scrollToBottom = props.scrollToBottom, threadList = props.threadList, unreadCount = props.unreadCount;
    var t = (0, TranslationContext_1.useTranslationContext)('MessageListNotifications').t;
    return (<div className='str-chat__list-notifications'>
      {notifications.map(function (notification) { return (<CustomNotification_1.CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification_1.CustomNotification>); })}
      <ClientNotifications />
      <ConnectionStatus_1.ConnectionStatus />
      <MessageNotification isMessageListScrolledToBottom={isMessageListScrolledToBottom} onClick={scrollToBottom} showNotification={hasNewMessages || isNotAtLatestMessageSet} threadList={threadList} unreadCount={unreadCount}>
        {isNotAtLatestMessageSet ? t('Latest Messages') : t('New Messages!')}
      </MessageNotification>
    </div>);
};
exports.MessageListNotifications = MessageListNotifications;
