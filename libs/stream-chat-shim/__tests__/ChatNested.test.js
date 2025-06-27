"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Chat_1 = require("../src/components/Chat/Chat");
test('renders without crashing', function () {
    (0, react_2.render)(<Chat_1.Chat client={{}}/>);
});
