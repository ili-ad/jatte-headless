"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AddCommentForm_1 = require("../src/components/Poll/PollActions/AddCommentForm");
test('renders without crashing', function () {
    (0, react_2.render)(<AddCommentForm_1.AddCommentForm close={function () { }} messageId="1"/>);
});
