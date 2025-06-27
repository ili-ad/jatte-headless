"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Mention_1 = require("../src/Mention");
describe('Mention component', function () {
    it('renders user mention span', function () {
        var getByText = (0, react_2.render)(<Mention_1.Mention node={{ mentionedUser: { id: 'bob' } }}>
        @bob
      </Mention_1.Mention>).getByText;
        var span = getByText('@bob');
        expect(span.getAttribute('data-user-id')).toBe('bob');
        expect(span.className).toContain('str-chat__message-mention');
    });
});
