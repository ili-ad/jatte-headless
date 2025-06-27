"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ThreadListItemUI_1 = require("../src/components/Threads/ThreadList/ThreadListItemUI");
test('renders without crashing', function () {
    (0, react_2.render)(<ThreadListItemUI_1.ThreadListItemUI />);
});
