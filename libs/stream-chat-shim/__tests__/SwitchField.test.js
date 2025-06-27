"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SwitchField_1 = require("../src/components/Form/SwitchField");
test('renders without crashing', function () {
    (0, react_2.render)(<SwitchField_1.SwitchField />);
});
