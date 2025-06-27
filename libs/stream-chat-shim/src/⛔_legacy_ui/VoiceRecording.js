"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRecording = void 0;
var react_1 = require("react");
/** Placeholder VoiceRecording component. */
var VoiceRecording = function (_a) {
    var isQuoted = _a.isQuoted;
    return (<div data-testid="voice-recording-placeholder">
    {isQuoted ? 'Quoted Voice Recording' : 'Voice Recording'}
  </div>);
};
exports.VoiceRecording = VoiceRecording;
exports.default = exports.VoiceRecording;
