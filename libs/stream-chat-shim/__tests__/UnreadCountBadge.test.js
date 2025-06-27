"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var UnreadCountBadge_1 = require("../src/components/Threads/UnreadCountBadge");
test('renders without crashing', function () {
    (0, react_2.render)(<UnreadCountBadge_1.UnreadCountBadge count={1}>child</UnreadCountBadge_1.UnreadCountBadge>);
});
