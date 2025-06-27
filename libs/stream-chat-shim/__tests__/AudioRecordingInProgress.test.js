"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AudioRecordingInProgress_1 = require("../src/components/MediaRecorder/AudioRecorder/AudioRecordingInProgress");
test('renders without crashing', function () {
    (0, react_2.render)(<AudioRecordingInProgress_1.AudioRecordingInProgress />);
});
