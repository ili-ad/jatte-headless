"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var CommandItem_1 = require("../src/CommandItem");
test('renders command info', function () {
    var entity = {
        name: '/giphy',
        args: 'cat',
        description: 'Giphy command',
    };
    var container = (0, react_2.render)(<CommandItem_1.CommandItem entity={entity}/>).container;
    expect(container.textContent).toContain('/giphy');
    expect(container.textContent).toContain('Giphy command');
});
