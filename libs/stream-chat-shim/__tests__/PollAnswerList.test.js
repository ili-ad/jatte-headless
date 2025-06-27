"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollAnswerList_1 = require("../src/components/Poll/PollActions/PollAnswerList");
test('renders without crashing', function () {
    (0, react_2.render)(<PollAnswerList_1.PollAnswerList onUpdateOwnAnswerClick={function () { }}/>);
});
