"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var WithDragAndDropUpload_1 = require("../src/WithDragAndDropUpload");
test('renders children', function () {
    var getByTestId = (0, react_2.render)(<WithDragAndDropUpload_1.WithDragAndDropUpload>child</WithDragAndDropUpload_1.WithDragAndDropUpload>).getByTestId;
    var el = getByTestId('with-drag-and-drop-upload-placeholder');
    expect(el).toHaveTextContent('child');
});
