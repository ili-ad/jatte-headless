"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var EmoticonItem_1 = require("../src/components/TextareaComposer/SuggestionList/EmoticonItem");
test('renders without crashing', function () {
    var entity = { name: ':smile:', native: '😄', tokenizedDisplayName: { token: 'smile', parts: ['smile'] } };
    (0, react_2.render)(<EmoticonItem_1.EmoticonItem entity={entity}/>);
});
