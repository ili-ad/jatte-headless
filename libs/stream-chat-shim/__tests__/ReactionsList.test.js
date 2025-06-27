"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ReactionsList_1 = require("../src/components/Reactions/ReactionsList");
test('renders without crashing', function () {
    var getByTestId = (0, react_2.render)(<ReactionsList_1.ReactionsList />).getByTestId;
    expect(getByTestId('reaction-list')).toBeTruthy();
});
