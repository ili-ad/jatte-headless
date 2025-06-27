"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageText_1 = require("../src/components/Message/MessageText");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageText_1.MessageText />);
});
