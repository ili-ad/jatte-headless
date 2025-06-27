"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioRecordingPreview = void 0;
var react_1 = require("react");
var PauseIcon = function () { return null; };
var PlayIcon = function () { return null; };
var RecordingTimer_1 = require("./RecordingTimer");
var useAudioController = function () { return ({
    audioRef: { current: null },
    isPlaying: false,
    progress: 0,
    secondsElapsed: 0,
    seek: function () { },
    togglePlay: function () { },
}); };
var WaveProgressBar = function () { return null; };
var AudioRecordingPreview = function (_a) {
    var durationSeconds = _a.durationSeconds, mimeType = _a.mimeType, waveformData = _a.waveformData, props = __rest(_a, ["durationSeconds", "mimeType", "waveformData"]);
    var _b = useAudioController({
        durationSeconds: durationSeconds,
        mimeType: mimeType,
    }), audioRef = _b.audioRef, isPlaying = _b.isPlaying, progress = _b.progress, secondsElapsed = _b.secondsElapsed, seek = _b.seek, togglePlay = _b.togglePlay;
    var displayedDuration = secondsElapsed || durationSeconds;
    return (<react_1.default.Fragment>
      <audio ref={audioRef}>
        <source src={props.src} type={mimeType}/>
      </audio>
      <button className='str-chat__audio_recorder__toggle-playback-button' data-testid='audio-recording-preview-toggle-play-btn' onClick={togglePlay}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <RecordingTimer_1.RecordingTimer durationSeconds={displayedDuration}/>
      <div className='str-chat__wave-progress-bar__track-container'>
        <WaveProgressBar progress={progress} seek={seek} waveformData={waveformData || []}/>
      </div>
    </react_1.default.Fragment>);
};
exports.AudioRecordingPreview = AudioRecordingPreview;
