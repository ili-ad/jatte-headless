"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var CustomMessageActionsList_1 = require("../src/CustomMessageActionsList");
test('renders custom actions and handles click', function () {
    var handler = jest.fn();
    var getByText = (0, react_2.render)(<CustomMessageActionsList_1.CustomMessageActionsList message={{}} customMessageActions={{ Test: handler }}/>).getByText;
    var button = getByText('Test');
    react_2.fireEvent.click(button);
    expect(handler).toHaveBeenCalled();
});
