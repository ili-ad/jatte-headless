"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var icons_1 = require("../src/components/MessageList/icons");
test('renders MessageList icons', function () {
    (0, react_2.render)(<icons_1.ArrowDown />);
    (0, react_2.render)(<icons_1.ArrowUp />);
    (0, react_2.render)(<icons_1.CloseIcon />);
});
