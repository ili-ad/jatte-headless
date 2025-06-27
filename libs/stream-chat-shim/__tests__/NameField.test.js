"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var NameField_1 = require("../src/components/Poll/PollCreationDialog/NameField");
test('renders without crashing', function () {
    (0, react_2.render)(<NameField_1.NameField />);
});
