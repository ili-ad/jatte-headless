"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollCreationDialog_1 = require("../src/components/Poll/PollCreationDialog/PollCreationDialog");
test('renders without crashing', function () {
    (0, react_2.render)(<PollCreationDialog_1.PollCreationDialog close={function () { }}/>);
});
