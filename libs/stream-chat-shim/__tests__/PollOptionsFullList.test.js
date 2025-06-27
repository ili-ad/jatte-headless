"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var PollOptionsFullList_1 = require("../src/components/Poll/PollActions/PollOptionsFullList");
test('renders without crashing', function () {
    (0, react_1.render)(<PollOptionsFullList_1.PollOptionsFullList />);
});
