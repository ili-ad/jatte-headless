"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Avatar_1 = require("../src/components/Avatar/Avatar");
test('renders without crashing', function () {
    (0, react_2.render)(<Avatar_1.Avatar />);
});
