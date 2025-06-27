"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollOptionList_1 = require("../src/components/Poll/PollOptionList");
test('renders without crashing', function () {
    (0, react_2.render)(<PollOptionList_1.PollOptionList />);
});
