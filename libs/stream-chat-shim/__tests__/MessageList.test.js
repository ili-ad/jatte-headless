"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageList_1 = require("../src/MessageList");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<MessageList_1.MessageList />).getByTestId;
    expect(getByTestId('message-list-placeholder')).toBeTruthy();
});
