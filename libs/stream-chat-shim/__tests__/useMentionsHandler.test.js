"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMentionsHandler_1 = require("../src/useMentionsHandler");
describe('useMentionsHandler', function () {
    test('calls hover and click handlers with mentioned users', function () {
        var hover = jest.fn();
        var click = jest.fn();
        var message = { mentioned_users: [{ id: 'bob', name: 'Bob' }] };
        var result = (0, react_1.renderHook)(function () {
            return (0, useMentionsHandler_1.useMentionsHandler)(message, {
                onMentionsHover: hover,
                onMentionsClick: click,
            });
        }).result;
        (0, react_1.act)(function () {
            result.current.onMentionsHover({});
            result.current.onMentionsClick({});
        });
        expect(hover).toHaveBeenCalledWith({}, message.mentioned_users);
        expect(click).toHaveBeenCalledWith({}, message.mentioned_users);
    });
});
