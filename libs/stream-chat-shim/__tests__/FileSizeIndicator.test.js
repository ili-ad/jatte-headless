"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var FileSizeIndicator_1 = require("../src/components/Attachment/components/FileSizeIndicator");
test('renders without crashing', function () {
    var getByTestId = (0, react_2.render)(<FileSizeIndicator_1.FileSizeIndicator fileSize={1024}/>).getByTestId;
    expect(getByTestId('file-size-indicator')).toBeTruthy();
});
