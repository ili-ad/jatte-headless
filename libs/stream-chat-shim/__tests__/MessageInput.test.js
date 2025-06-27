"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageInput_1 = require("../src/components/MessageInput/MessageInput");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageInput_1.MessageInput />);
});
