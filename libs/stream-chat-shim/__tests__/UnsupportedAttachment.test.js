"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var UnsupportedAttachment_1 = require("../src/components/Attachment/UnsupportedAttachment");
test('renders without crashing', function () {
    (0, react_2.render)(<UnsupportedAttachment_1.UnsupportedAttachment attachment={{}} as any/>);
});
