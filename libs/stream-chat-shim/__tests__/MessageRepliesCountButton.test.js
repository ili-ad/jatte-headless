"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageRepliesCountButton_1 = require("../src/components/Message/MessageRepliesCountButton");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageRepliesCountButton_1.MessageRepliesCountButton reply_count={1}/>);
});
