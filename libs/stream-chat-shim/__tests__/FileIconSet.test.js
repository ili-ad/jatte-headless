"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FileIconSet_1 = require("../src/components/ReactFileUtilities/FileIcon/FileIconSet");
var react_1 = require("@testing-library/react");
var react_2 = require("react");
test('renders FilePdfIcon without crashing', function () {
    (0, react_1.render)(<FileIconSet_1.FilePdfIcon />);
});
