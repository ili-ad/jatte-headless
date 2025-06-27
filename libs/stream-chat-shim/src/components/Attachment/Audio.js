"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Audio = void 0;
var react_1 = require("react");
var components_1 = require("./components");
var useAudioController_1 = require("./hooks/useAudioController");
var UnMemoizedAudio = function (props) {
    var _a = props.og, asset_url = _a.asset_url, file_size = _a.file_size, mime_type = _a.mime_type, title = _a.title;
    var _b = (0, useAudioController_1.useAudioController)({
        mimeType: mime_type,
    }), audioRef = _b.audioRef, isPlaying = _b.isPlaying, progress = _b.progress, seek = _b.seek, togglePlay = _b.togglePlay;
    if (!asset_url)
        return null;
    var dataTestId = 'audio-widget';
    var rootClassName = 'str-chat__message-attachment-audio-widget';
    return (<div className={rootClassName} data-testid={dataTestId}>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={asset_url} type='audio/mp3'/>
      </audio>
      <div className='str-chat__message-attachment-audio-widget--play-controls'>
        <components_1.PlayButton isPlaying={isPlaying} onClick={togglePlay}/>
      </div>
      <div className='str-chat__message-attachment-audio-widget--text'>
        <div className='str-chat__message-attachment-audio-widget--text-first-row'>
          <div className='str-chat__message-attachment-audio-widget--title'>{title}</div>
          <components_1.DownloadButton assetUrl={asset_url}/>
        </div>
        <div className='str-chat__message-attachment-audio-widget--text-second-row'>
          <components_1.FileSizeIndicator fileSize={file_size}/>
          <components_1.ProgressBar onClick={seek} progress={progress}/>
        </div>
      </div>
    </div>);
};
/**
 * Audio attachment with play/pause button and progress bar
 */
exports.Audio = react_1.default.memo(UnMemoizedAudio);
