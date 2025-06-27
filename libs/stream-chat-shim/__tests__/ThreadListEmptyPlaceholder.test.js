"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ThreadListEmptyPlaceholder_1 = require("../src/components/Threads/ThreadList/ThreadListEmptyPlaceholder");
test('renders without crashing', function () {
    (0, react_2.render)(<ThreadListEmptyPlaceholder_1.ThreadListEmptyPlaceholder />);
});
