"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Window_1 = require("../src/components/Window/Window");
test('renders without crashing', function () {
    (0, react_2.render)(<Window_1.Window />);
});
