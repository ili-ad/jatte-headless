"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var ReactionSelectorWithButton_1 = require("../src/components/Reactions/ReactionSelectorWithButton");
var icons_1 = require("../src/components/Message/icons");
test('renders without crashing', function () {
    (0, react_1.render)(<ReactionSelectorWithButton_1.ReactionSelectorWithButton ReactionIcon={icons_1.ReactionIcon}/>);
});
