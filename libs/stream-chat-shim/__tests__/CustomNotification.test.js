"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var CustomNotification_1 = require("../src/components/MessageList/CustomNotification");
test('renders without crashing', function () {
    (0, react_2.render)(<CustomNotification_1.CustomNotification active type="info"/>);
});
