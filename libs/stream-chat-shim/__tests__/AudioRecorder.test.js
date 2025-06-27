"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var AudioRecorder_1 = require("../src/components/MediaRecorder/AudioRecorder/AudioRecorder");
test('renders without crashing', function () {
    (0, react_2.render)(<AudioRecorder_1.AudioRecorder />);
});
