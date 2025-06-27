"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SuggestionListItem_1 = require("../src/components/TextareaComposer/SuggestionList/SuggestionListItem");
test('renders without crashing', function () {
    (0, react_2.render)(<SuggestionListItem_1.SuggestionListItem component={function () { return null; }} item={{}} focused={false}/>);
});
