"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollActions_1 = require("../src/components/Poll/PollActions/PollActions");
test('renders without crashing', function () {
    (0, react_2.render)(<PollActions_1.PollActions />);
});
