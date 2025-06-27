"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageListNotifications_1 = require("../src/components/MessageList/MessageListNotifications");
var MessageNotification_1 = require("../src/components/MessageList/MessageNotification");
describe('MessageListNotifications', function () {
    test('renders without crashing', function () {
        (0, react_2.render)(<MessageListNotifications_1.MessageListNotifications hasNewMessages={false} isMessageListScrolledToBottom={true} isNotAtLatestMessageSet={false} MessageNotification={MessageNotification_1.MessageNotification} notifications={[]} scrollToBottom={function () { }}/>);
    });
});
