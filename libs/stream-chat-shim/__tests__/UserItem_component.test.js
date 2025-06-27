"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var UserItem_1 = require("../src/components/TextareaComposer/SuggestionList/UserItem");
test('renders without crashing', function () {
    var entity = {
        tokenizedDisplayName: { token: 'bob', parts: ['Bob'] },
        id: '123',
        image: 'img',
        name: 'Bob',
    };
    (0, react_2.render)(<UserItem_1.UserItem entity={entity}/>);
});
