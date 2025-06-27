"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AudioRecordingPreview_1 = require("../src/components/MediaRecorder/AudioRecorder/AudioRecordingPreview");
test('renders without crashing', function () {
    (0, react_2.render)(<AudioRecordingPreview_1.AudioRecordingPreview durationSeconds={0}/>);
});
