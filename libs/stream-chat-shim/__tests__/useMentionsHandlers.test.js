"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMentionsHandlers_1 = require("../src/useMentionsHandlers");
var event = function (type, targetText) {
    var target = document.createElement('span');
    target.innerHTML = targetText;
    return { type: type, target: target };
};
describe('useMentionsHandlers', function () {
    test('calls hover and click handlers', function () {
        var hover = jest.fn();
        var click = jest.fn();
        var result = (0, react_1.renderHook)(function () { return (0, useMentionsHandlers_1.useMentionsHandlers)(hover, click); }).result;
        (0, react_1.act)(function () {
            result.current(event('mouseover', '@bob'), [{ id: 'bob', name: 'Bob' }]);
            result.current(event('click', '@bob'), [{ id: 'bob', name: 'Bob' }]);
        });
        expect(hover).toHaveBeenCalled();
        expect(click).toHaveBeenCalled();
    });
});
