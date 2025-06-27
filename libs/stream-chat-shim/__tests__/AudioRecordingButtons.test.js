"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AudioRecordingButtons_1 = require("../src/components/MediaRecorder/AudioRecorder/AudioRecordingButtons");
test('renders without crashing', function () {
    (0, react_2.render)(<AudioRecordingButtons_1.StartRecordingAudioButton />);
});
