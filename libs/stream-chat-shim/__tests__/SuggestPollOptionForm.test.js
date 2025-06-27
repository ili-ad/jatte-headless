"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SuggestPollOptionForm_1 = require("../src/components/Poll/PollActions/SuggestPollOptionForm");
test('renders without crashing', function () {
    (0, react_2.render)(<SuggestPollOptionForm_1.SuggestPollOptionForm close={function () { }} messageId=""/>);
});
