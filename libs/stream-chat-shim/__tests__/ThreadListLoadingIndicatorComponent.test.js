"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ThreadListLoadingIndicator_1 = require("../src/components/Threads/ThreadList/ThreadListLoadingIndicator");
test('renders without crashing', function () {
    (0, react_2.render)(<ThreadListLoadingIndicator_1.ThreadListLoadingIndicator />);
});
