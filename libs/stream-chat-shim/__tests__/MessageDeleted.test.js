"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageDeleted_1 = require("../src/MessageDeleted");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<MessageDeleted_1.MessageDeleted message={{ id: '1' }}/>).getByTestId;
    expect(getByTestId('message-deleted-component')).toBeTruthy();
});
