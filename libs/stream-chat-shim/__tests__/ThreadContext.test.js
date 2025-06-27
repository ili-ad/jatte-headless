"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ThreadContext_1 = require("../src/components/Threads/ThreadContext");
test('renders without crashing', function () {
    (0, react_2.render)(<ThreadContext_1.ThreadProvider />);
});
