"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var QuotedPoll_1 = require("../src/QuotedPoll");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<QuotedPoll_1.QuotedPoll />).getByTestId;
    expect(getByTestId('quoted-poll-placeholder')).toBeTruthy();
});
