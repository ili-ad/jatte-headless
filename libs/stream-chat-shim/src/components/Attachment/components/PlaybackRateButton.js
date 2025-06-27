"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaybackRateButton = void 0;
var react_1 = require("react");
var PlaybackRateButton = function (_a) {
    var children = _a.children, onClick = _a.onClick;
    return (<button className='str-chat__message_attachment__playback-rate-button' data-testid='playback-rate-button' onClick={onClick}>
    {children}
  </button>);
};
exports.PlaybackRateButton = PlaybackRateButton;
