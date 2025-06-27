"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var FileIcon_1 = require("../src/components/ReactFileUtilities/FileIcon");
describe('FileIcon', function () {
    test('renders without crashing', function () {
        (0, react_1.render)(<FileIcon_1.FileIcon />);
    });
});
