"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRecording = exports.QuotedVoiceRecording = exports.VoiceRecordingPlayer = void 0;
var react_1 = require("react");
var components_1 = require("./components");
var useAudioController_1 = require("./hooks/useAudioController");
var utils_1 = require("./utils");
var ReactFileUtilities_1 = require("../ReactFileUtilities");
var context_1 = require("../../context");
var rootClassName = 'str-chat__message-attachment__voice-recording-widget';
var VoiceRecordingPlayer = function (_a) {
    var attachment = _a.attachment, playbackRates = _a.playbackRates;
    var t = (0, context_1.useTranslationContext)('VoiceRecordingPlayer').t;
    var asset_url = attachment.asset_url, _b = attachment.duration, duration = _b === void 0 ? 0 : _b, mime_type = attachment.mime_type, _c = attachment.title, title = _c === void 0 ? t('Voice message') : _c, waveform_data = attachment.waveform_data;
    var _d = (0, useAudioController_1.useAudioController)({
        durationSeconds: duration !== null && duration !== void 0 ? duration : 0,
        mimeType: mime_type,
        playbackRates: playbackRates,
    }), audioRef = _d.audioRef, increasePlaybackRate = _d.increasePlaybackRate, isPlaying = _d.isPlaying, playbackRate = _d.playbackRate, progress = _d.progress, secondsElapsed = _d.secondsElapsed, seek = _d.seek, togglePlay = _d.togglePlay;
    if (!asset_url)
        return null;
    var displayedDuration = secondsElapsed || duration;
    return (<div className={rootClassName} data-testid='voice-recording-widget'>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={asset_url} type={mime_type}/>
      </audio>
      <components_1.PlayButton isPlaying={isPlaying} onClick={togglePlay}/>
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        <div className='str-chat__message-attachment__voice-recording-widget__title' data-testid='voice-recording-title' title={title}>
          {title}
        </div>
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {attachment.duration ? ((0, utils_1.displayDuration)(displayedDuration)) : (<components_1.FileSizeIndicator fileSize={attachment.file_size} maximumFractionDigits={0}/>)}
          </div>
          <components_1.WaveProgressBar progress={progress} seek={seek} waveformData={waveform_data || []}/>
        </div>
      </div>
      <div className='str-chat__message-attachment__voice-recording-widget__right-section'>
        {isPlaying ? (<components_1.PlaybackRateButton disabled={!audioRef.current} onClick={increasePlaybackRate}>
            {playbackRate.toFixed(1)}x
          </components_1.PlaybackRateButton>) : (<ReactFileUtilities_1.FileIcon big={true} mimeType={mime_type} size={40}/>)}
      </div>
    </div>);
};
exports.VoiceRecordingPlayer = VoiceRecordingPlayer;
var QuotedVoiceRecording = function (_a) {
    var attachment = _a.attachment;
    var t = (0, context_1.useTranslationContext)().t;
    var title = attachment.title || t('Voice message');
    return (<div className={rootClassName} data-testid='quoted-voice-recording-widget'>
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        {title && (<div className='str-chat__message-attachment__voice-recording-widget__title' data-testid='voice-recording-title' title={title}>
            {title}
          </div>)}
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {attachment.duration ? ((0, utils_1.displayDuration)(attachment.duration)) : (<components_1.FileSizeIndicator fileSize={attachment.file_size} maximumFractionDigits={0}/>)}
          </div>
        </div>
      </div>
      <ReactFileUtilities_1.FileIcon big={true} mimeType={attachment.mime_type} size={34}/>
    </div>);
};
exports.QuotedVoiceRecording = QuotedVoiceRecording;
var VoiceRecording = function (_a) {
    var attachment = _a.attachment, isQuoted = _a.isQuoted;
    return isQuoted ? (<exports.QuotedVoiceRecording attachment={attachment}/>) : (<exports.VoiceRecordingPlayer attachment={attachment}/>);
};
exports.VoiceRecording = VoiceRecording;
