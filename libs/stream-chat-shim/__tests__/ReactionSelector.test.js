"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ReactionSelector_1 = require("../src/components/Reactions/ReactionSelector");
test('renders without crashing', function () {
    (0, react_2.render)(<ReactionSelector_1.ReactionSelector />);
});
