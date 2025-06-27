"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var TextareaComposer_1 = require("../src/TextareaComposer");
test('renders textarea and updates textComposer', function () {
    var controller = { state: { text: 'hi' }, setText: jest.fn() };
    var getByTestId = (0, react_2.render)(<TextareaComposer_1.TextareaComposer textComposer={controller}/>).getByTestId;
    var textarea = getByTestId('textarea-composer');
    expect(textarea.value).toBe('hi');
    react_2.fireEvent.change(textarea, { target: { value: 'bye' } });
    expect(controller.setText).toHaveBeenCalledWith('bye');
});
