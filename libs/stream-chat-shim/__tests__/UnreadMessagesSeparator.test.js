"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var UnreadMessagesSeparator_1 = require("../src/components/MessageList/UnreadMessagesSeparator");
test('renders unread messages separator', function () {
    (0, react_2.render)(<UnreadMessagesSeparator_1.UnreadMessagesSeparator unreadCount={1}/>);
});
