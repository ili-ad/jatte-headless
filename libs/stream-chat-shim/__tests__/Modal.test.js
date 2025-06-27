"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Modal_1 = require("../src/components/Modal/Modal");
test('renders without crashing', function () {
    (0, react_2.render)(<Modal_1.Modal open={false}/>);
});
