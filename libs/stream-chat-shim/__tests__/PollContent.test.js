"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollContent_1 = require("../src/components/Poll/PollContent");
test('renders without crashing', function () {
    (0, react_2.render)(<PollContent_1.PollContent />);
});
