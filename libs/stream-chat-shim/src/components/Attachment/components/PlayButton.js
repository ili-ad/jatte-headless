"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayButton = void 0;
var react_1 = require("react");
var icons_1 = require("../icons");
var PlayButton = function (_a) {
    var isPlaying = _a.isPlaying, onClick = _a.onClick;
    return (<button className='str-chat__message-attachment-audio-widget--play-button' data-testid={isPlaying ? 'pause-audio' : 'play-audio'} onClick={onClick}>
    {isPlaying ? <icons_1.PauseIcon /> : <icons_1.PlayTriangleIcon />}
  </button>);
};
exports.PlayButton = PlayButton;
