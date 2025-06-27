"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var UnsupportedAttachmentPreview_1 = require("../src/components/MessageInput/AttachmentPreviewList/UnsupportedAttachmentPreview");
test('renders without crashing', function () {
    (0, react_2.render)(<UnsupportedAttachmentPreview_1.UnsupportedAttachmentPreview attachment={{}} handleRetry={function () { return undefined; }} removeAttachments={function () { return undefined; }}/>);
});
