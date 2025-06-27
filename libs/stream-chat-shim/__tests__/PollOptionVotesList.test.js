"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollOptionVotesList_1 = require("../src/PollOptionVotesList");
test('renders placeholder', function () {
    var option = { id: '1', poll_id: '1', text: 'Option 1' };
    var getByTestId = (0, react_2.render)(<PollOptionVotesList_1.PollOptionVotesList option={option}/>).getByTestId;
    expect(getByTestId('poll-option-votes-list')).toBeTruthy();
});
