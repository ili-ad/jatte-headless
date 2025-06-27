"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var VoiceRecordingPreview_1 = require("../src/components/MessageInput/AttachmentPreviewList/VoiceRecordingPreview");
test('renders without crashing', function () {
    (0, react_2.render)(<VoiceRecordingPreview_1.VoiceRecordingPreview attachment={{}} handleRetry={function () { }} removeAttachments={function () { }}/>);
});
