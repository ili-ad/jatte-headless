"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartRecordingAudioButton = void 0;
var react_1 = require("react");
var icons_1 = require("../../MessageInput/icons");
var StartRecordingAudioButton = function (props) { return (<button aria-label='Start recording audio' className='str-chat__start-recording-audio-button' data-testid='start-recording-audio-button' {...props}>
    <icons_1.MicIcon />
  </button>); };
exports.StartRecordingAudioButton = StartRecordingAudioButton;
