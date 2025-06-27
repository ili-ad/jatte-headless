"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var EndPollDialog_1 = require("../src/components/Poll/PollActions/EndPollDialog");
describe('EndPollDialog', function () {
    test('renders without crashing', function () {
        (0, react_1.render)(<EndPollDialog_1.EndPollDialog close={function () { }}/>);
    });
});
