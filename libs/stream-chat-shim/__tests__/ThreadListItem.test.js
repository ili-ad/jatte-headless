"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ThreadListItem_1 = require("../src/components/Threads/ThreadList/ThreadListItem");
test('renders without crashing', function () {
    (0, react_2.render)(<ThreadListItem_1.ThreadListItem thread={{}}/>);
});
