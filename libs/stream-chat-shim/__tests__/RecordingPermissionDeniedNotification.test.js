"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var RecordingPermissionDeniedNotification_1 = require("../src/components/MediaRecorder/RecordingPermissionDeniedNotification");
describe('RecordingPermissionDeniedNotification component', function () {
    it('renders translation text', function () {
        var html = (0, server_1.renderToStaticMarkup)(<RecordingPermissionDeniedNotification_1.RecordingPermissionDeniedNotification permissionName="camera" onClose={function () { }}/>);
        expect(html).toContain('str-chat__recording-permission-denied-notification');
    });
});
