"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var LoadMoreButton_1 = require("../src/components/LoadMore/LoadMoreButton");
test('renders without crashing', function () {
    (0, react_2.render)(<LoadMoreButton_1.LoadMoreButton onClick={function () { }}/>);
});
