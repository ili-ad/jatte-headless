"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var UploadButton_1 = require("../src/components/ReactFileUtilities/UploadButton");
describe('ReactFileUtilities UploadButton', function () {
    test('renders without crashing', function () {
        (0, react_1.render)(<UploadButton_1.UploadButton onFileChange={function () { }}/>);
    });
});
