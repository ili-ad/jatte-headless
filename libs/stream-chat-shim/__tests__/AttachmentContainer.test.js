"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AttachmentContainer_1 = require("../src/components/Attachment/AttachmentContainer");
test('renders without crashing', function () {
    (0, react_2.render)(<AttachmentContainer_1.AttachmentContainer attachment={{}} componentType="image"/>);
});
