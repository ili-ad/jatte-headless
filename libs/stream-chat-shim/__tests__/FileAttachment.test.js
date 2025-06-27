"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var FileAttachment_1 = require("../src/components/Attachment/FileAttachment");
test('renders without crashing', function () {
    (0, react_2.render)(<FileAttachment_1.FileAttachment attachment={{}}/>);
});
