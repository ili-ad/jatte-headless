"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var VoiceRecording_1 = require("../src/components/Attachment/VoiceRecording");
test('renders without crashing', function () {
    (0, react_2.render)(<VoiceRecording_1.VoiceRecording attachment={{}}/>);
});
