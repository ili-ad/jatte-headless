"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var RecordingTimer_1 = require("../src/components/MediaRecorder/AudioRecorder/RecordingTimer");
describe('RecordingTimer component', function () {
    test('renders duration', function () {
        var html = (0, server_1.renderToStaticMarkup)(<RecordingTimer_1.RecordingTimer durationSeconds={10}/>);
        expect(html).toContain('10');
    });
});
