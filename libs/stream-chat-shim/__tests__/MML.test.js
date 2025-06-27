"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var MML_1 = require("../src/components/MML/MML");
test('renders without crashing', function () {
    (0, react_1.render)(<MML_1.MML source=""/>);
});
