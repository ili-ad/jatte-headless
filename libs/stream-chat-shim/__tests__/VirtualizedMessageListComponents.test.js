"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var VirtualizedMessageListComponents_1 = require("../src/components/MessageList/VirtualizedMessageListComponents");
describe('VirtualizedMessageListComponents shim', function () {
    test('index helpers use offset', function () {
        var idx = (0, VirtualizedMessageListComponents_1.calculateItemIndex)(5, 3);
        var first = (0, VirtualizedMessageListComponents_1.calculateFirstItemIndex)(3);
        expect(idx).toBe(5 + 3 - Math.pow(10, 7));
        expect(first).toBe(Math.pow(10, 7) - 3);
    });
    test('Item renders a div', function () {
        var container = (0, react_2.render)(<VirtualizedMessageListComponents_1.Item data-item-index={0}/>).container;
        expect(container.querySelector('div')).toBeTruthy();
    });
    test('messageRenderer returns element', function () {
        var el = (0, VirtualizedMessageListComponents_1.messageRenderer)(0, null, {});
        var getByTestId = (0, react_2.render)(<>{el}</>).getByTestId;
        expect(getByTestId('virtualized-message')).toBeTruthy();
    });
    test('EmptyPlaceholder renders when no messages', function () {
        var getByTestId = (0, react_2.render)(<VirtualizedMessageListComponents_1.EmptyPlaceholder context={{}}/>).getByTestId;
        expect(getByTestId('virtualized-message-list-empty')).toBeTruthy();
    });
});
