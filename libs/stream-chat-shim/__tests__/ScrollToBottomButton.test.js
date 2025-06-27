"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ScrollToBottomButton_1 = require("../src/ScrollToBottomButton");
describe('ScrollToBottomButton', function () {
    it('does not render when list is scrolled to bottom', function () {
        var queryByTestId = (0, react_2.render)(<ScrollToBottomButton_1.ScrollToBottomButton isMessageListScrolledToBottom onClick={function () { }}/>).queryByTestId;
        expect(queryByTestId('message-notification')).toBeNull();
    });
    it('calls onClick when clicked', function () {
        var handler = jest.fn();
        var getByTestId = (0, react_2.render)(<ScrollToBottomButton_1.ScrollToBottomButton onClick={handler}/>).getByTestId;
        react_2.fireEvent.click(getByTestId('message-notification'));
        expect(handler).toHaveBeenCalled();
    });
});
