"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var DateSeparator_1 = require("../src/components/DateSeparator/DateSeparator");
test('renders without crashing', function () {
    (0, react_2.render)(<DateSeparator_1.DateSeparator date={new Date()}/>);
});
