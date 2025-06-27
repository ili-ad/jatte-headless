"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var UploadButton_1 = require("../src/UploadButton");
test('calls onFileChange when files selected', function () {
    var handler = jest.fn();
    var getByTestId = (0, react_2.render)(<UploadButton_1.UploadButton data-testid="upload" onFileChange={handler}/>).getByTestId;
    var input = getByTestId('upload');
    var file = new File(['x'], 'test.txt');
    Object.defineProperty(input, 'files', { value: [file] });
    react_2.fireEvent.change(input);
    expect(handler).toHaveBeenCalledWith([file]);
});
