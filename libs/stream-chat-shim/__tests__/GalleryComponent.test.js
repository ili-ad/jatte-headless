"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Gallery_1 = require("../src/components/Gallery/Gallery");
test('renders without crashing', function () {
    (0, react_2.render)(<Gallery_1.Gallery images={[]}/>);
});
