"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SuggestionList_1 = require("../src/components/TextareaComposer/SuggestionList/SuggestionList");
test('renders without crashing', function () {
    (0, react_2.render)(<SuggestionList_1.SuggestionList />);
});
