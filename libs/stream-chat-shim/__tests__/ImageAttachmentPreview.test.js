"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ImageAttachmentPreview_1 = require("../src/ImageAttachmentPreview");
describe('ImageAttachmentPreview', function () {
    it('renders placeholder', function () {
        var getByTestId = (0, react_2.render)(<ImageAttachmentPreview_1.ImageAttachmentPreview attachment={{}} as any/>).getByTestId;
        expect(getByTestId('image-attachment-preview-placeholder')).toBeTruthy();
    });
});
