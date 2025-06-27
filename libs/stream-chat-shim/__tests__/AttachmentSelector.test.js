"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AttachmentSelector_1 = require("../src/components/MessageInput/AttachmentSelector");
test('renders without crashing', function () {
    (0, react_2.render)(<AttachmentSelector_1.AttachmentSelector />);
});
