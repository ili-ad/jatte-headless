"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var icons_1 = require("../src/components/EmptyStateIndicator/icons");
test('renders chat bubble icon', function () {
    var getByTestId = (0, react_2.render)(<icons_1.ChatBubble />).getByTestId;
    expect(getByTestId('chat-bubble')).toB;
    (0, react_2.render)(<MenuIcon />);
    (0, react_2.render)(<ReturnIcon />);
    (0, react_2.render)(<XIcon />);
    (0, react_2.render)(<SearchIcon className=''/>);
});
