"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelActionContext_1 = require("../src/\u26D4_legacy_ui/ChannelActionContext");
var UnreadMessagesNotification_1 = require("../src/components/MessageList/UnreadMessagesNotification");
describe('UnreadMessagesNotification', function () {
    it('calls actions when buttons clicked', function () {
        var jumpToFirstUnreadMessage = jest.fn();
        var markRead = jest.fn();
        var _a = (0, react_2.render)(<ChannelActionContext_1.ChannelActionProvider jumpToFirstUnreadMessage={jumpToFirstUnreadMessage} markRead={markRead}>
        <UnreadMessagesNotification_1.UnreadMessagesNotification showCount unreadCount={3}/>
      </ChannelActionContext_1.ChannelActionProvider>), getByText = _a.getByText, getByTestId = _a.getByTestId;
        react_2.fireEvent.click(getByText('3 unread'));
        expect(jumpToFirstUnreadMessage).toHaveBeenCalled();
        react_2.fireEvent.click(getByTestId('unread-messages-notification').querySelector('button:last-child'));
        expect(markRead).toHaveBeenCalled();
    });
});
