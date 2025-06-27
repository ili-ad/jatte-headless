"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChatView_1 = require("../src/components/ChatView/ChatView");
test('renders without crashing', function () {
    (0, react_2.render)(<ChatView_1.ChatView />);
});
