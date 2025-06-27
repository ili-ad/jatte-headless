"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollOptionWithLatestVotes_1 = require("../src/components/Poll/PollActions/PollResults/PollOptionWithLatestVotes");
test('renders without crashing', function () {
    (0, react_2.render)(<PollOptionWithLatestVotes_1.PollOptionWithLatestVotes option={{ id: '1', text: 'Opt' }}/>);
});
