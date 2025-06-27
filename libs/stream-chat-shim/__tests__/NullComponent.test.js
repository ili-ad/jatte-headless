"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var UtilityComponents_1 = require("../src/components/UtilityComponents");
test('renders without crashing', function () {
    (0, react_1.render)(<UtilityComponents_1.NullComponent />);
});
