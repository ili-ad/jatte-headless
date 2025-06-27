"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Poll_1 = require("../src/components/Poll/Poll");
test('renders without crashing', function () {
    (0, react_2.render)(<Poll_1.Poll poll={{ id: '1' }}/>);
});
