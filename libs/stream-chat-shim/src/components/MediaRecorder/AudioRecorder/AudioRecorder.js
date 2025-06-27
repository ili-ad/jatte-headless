"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioRecorder = void 0;
var react_1 = require("react");
var AudioRecordingPreview_1 = require("./AudioRecordingPreview");
var AudioRecordingInProgress_1 = require("./AudioRecordingInProgress");
var classes_1 = require("../classes");
var MessageInput_1 = require("../../MessageInput");
var MessageInputContext_1 = require("../../../context/MessageInputContext");
var AudioRecorder = function () {
    var _a, _b;
    var messageInputContext = (0, MessageInputContext_1.useMessageInputContext)();
    var _c = messageInputContext.recordingController, completeRecording = _c.completeRecording, recorder = _c.recorder, recording = _c.recording, recordingState = _c.recordingState;
    var isUploadingFile = ((_a = recording === null || recording === void 0 ? void 0 : recording.localMetadata) === null || _a === void 0 ? void 0 : _a.uploadState) === 'uploading';
    var state = (0, react_1.useMemo)(function () { return ({
        paused: recordingState === classes_1.MediaRecordingState.PAUSED,
        recording: recordingState === classes_1.MediaRecordingState.RECORDING,
        stopped: recordingState === classes_1.MediaRecordingState.STOPPED,
    }); }, [recordingState]);
    if (!recorder)
        return null;
    return (<div className='str-chat__audio_recorder-container'>
      <div className='str-chat__audio_recorder' data-testid={'audio-recorder'}>
        <button className='str-chat__audio_recorder__cancel-button' data-testid={'cancel-recording-audio-button'} disabled={isUploadingFile} onClick={recorder.cancel}>
          <MessageInput_1.BinIcon />
        </button>

        {state.stopped && (recording === null || recording === void 0 ? void 0 : recording.asset_url) ? (<AudioRecordingPreview_1.AudioRecordingPreview durationSeconds={(_b = recording.duration) !== null && _b !== void 0 ? _b : 0} mimeType={recording.mime_type} src={recording.asset_url} waveformData={recording.waveform_data}/>) : state.paused || state.recording ? (<AudioRecordingInProgress_1.AudioRecordingInProgress />) : null}

        {state.paused && (<button className='str-chat__audio_recorder__resume-recording-button' onClick={recorder.resume}>
            <MessageInput_1.MicIcon />
          </button>)}
        {state.recording && (<button className='str-chat__audio_recorder__pause-recording-button' data-testid={'pause-recording-audio-button'} onClick={recorder.pause}>
            <MessageInput_1.PauseIcon />
          </button>)}
        {state.stopped ? (<button className='str-chat__audio_recorder__complete-button' data-testid='audio-recorder-complete-button' disabled={isUploadingFile} onClick={completeRecording}>
            {isUploadingFile ? <MessageInput_1.LoadingIndicatorIcon /> : <MessageInput_1.SendIcon />}
          </button>) : (<button className='str-chat__audio_recorder__stop-button' data-testid='audio-recorder-stop-button' onClick={recorder.stop}>
            <MessageInput_1.CheckSignIcon />
          </button>)}
      </div>
    </div>);
};
exports.AudioRecorder = AudioRecorder;
