"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioRecordingInProgress = void 0;
var react_1 = require("react");
var useTimeElapsed_1 = require("./hooks/useTimeElapsed");
var context_1 = require("../../../context");
var RecordingTimer_1 = require("./RecordingTimer");
var AudioRecordingWaveform = function (_a) {
    var _b = _a.maxDataPointsDrawn, maxDataPointsDrawn = _b === void 0 ? 100 : _b;
    var recorder = (0, context_1.useMessageInputContext)().recordingController.recorder;
    var _c = (0, react_1.useState)([]), amplitudes = _c[0], setAmplitudes = _c[1];
    (0, react_1.useEffect)(function () {
        if (!(recorder === null || recorder === void 0 ? void 0 : recorder.amplitudeRecorder))
            return;
        var amplitudesSubscription = recorder.amplitudeRecorder.amplitudes.subscribe(setAmplitudes);
        return function () {
            amplitudesSubscription.unsubscribe();
        };
    }, [recorder]);
    if (!recorder)
        return null;
    return (<div className='str-chat__waveform-box-container'>
      <div className='str-chat__audio_recorder__waveform-box'>
        {amplitudes.slice(-maxDataPointsDrawn).map(function (amplitude, i) { return (<div className='str-chat__wave-progress-bar__amplitude-bar' key={"amplitude-".concat(i, "-voice-recording")} style={{
                '--str-chat__wave-progress-bar__amplitude-bar-height': amplitude
                    ? amplitude * 100 + '%'
                    : '0%',
            }}/>); })}
      </div>
    </div>);
};
var AudioRecordingInProgress = function () {
    var _a = (0, useTimeElapsed_1.useTimeElapsed)(), secondsElapsed = _a.secondsElapsed, startCounter = _a.startCounter, stopCounter = _a.stopCounter;
    var recorder = (0, context_1.useMessageInputContext)().recordingController.recorder;
    (0, react_1.useEffect)(function () {
        if (!(recorder === null || recorder === void 0 ? void 0 : recorder.mediaRecorder))
            return;
        var mediaRecorder = recorder.mediaRecorder;
        if (mediaRecorder.state === 'recording') {
            startCounter();
        }
        mediaRecorder.addEventListener('start', startCounter);
        mediaRecorder.addEventListener('resume', startCounter);
        mediaRecorder.addEventListener('stop', stopCounter);
        mediaRecorder.addEventListener('pause', stopCounter);
        return function () {
            mediaRecorder.removeEventListener('start', startCounter);
            mediaRecorder.removeEventListener('resume', startCounter);
            mediaRecorder.removeEventListener('stop', stopCounter);
            mediaRecorder.removeEventListener('pause', stopCounter);
        };
    }, [recorder, startCounter, stopCounter]);
    return (<react_1.default.Fragment>
      <RecordingTimer_1.RecordingTimer durationSeconds={secondsElapsed}/>
      <AudioRecordingWaveform />
    </react_1.default.Fragment>);
};
exports.AudioRecordingInProgress = AudioRecordingInProgress;
