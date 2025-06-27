"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var CommandItem_1 = require("../src/components/TextareaComposer/SuggestionList/CommandItem");
test('renders without crashing', function () {
    var entity = { name: '/test', args: '', description: 'desc' };
    (0, react_2.render)(<CommandItem_1.CommandItem entity={entity}/>);
});
