"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var icons_1 = require("../src/components/Thread/icons");
test('renders thread icons without crashing', function () {
    (0, react_2.render)(<icons_1.CloseIcon />);
});
