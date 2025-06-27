"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollResults_1 = require("../src/components/Poll/PollActions/PollResults");
test('renders without crashing', function () {
    (0, react_2.render)(<PollResults_1.PollResults />);
});
