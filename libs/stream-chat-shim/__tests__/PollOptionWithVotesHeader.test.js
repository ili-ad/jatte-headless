"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollOptionWithVotesHeader_1 = require("../src/components/Poll/PollActions/PollResults/PollOptionWithVotesHeader");
test('renders without crashing', function () {
    var getByTestId = (0, react_2.render)(<PollOptionWithVotesHeader_1.PollOptionWithVotesHeader option={{ id: '1', text: 'Opt' }}/>).getByTestId;
    expect(getByTestId('poll-option-with-votes-header')).toBeTruthy();
});
