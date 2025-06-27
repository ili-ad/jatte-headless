"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var FixedHeightMessage_1 = require("../src/components/Message/FixedHeightMessage");
test('renders without crashing', function () {
    (0, react_2.render)(<FixedHeightMessage_1.FixedHeightMessage />);
});
