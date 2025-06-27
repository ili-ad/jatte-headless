"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var FileAttachmentPreview_1 = require("../src/components/MessageInput/AttachmentPreviewList/FileAttachmentPreview");
test('renders without crashing', function () {
    (0, react_2.render)(<FileAttachmentPreview_1.FileAttachmentPreview attachment={{}} handleRetry={function () { }} removeAttachments={function () { }}/>);
});
