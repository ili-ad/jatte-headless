"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var ProgressBar = function (_a) {
    var className = _a.className, onClick = _a.onClick, progress = _a.progress;
    return (<div className={(0, clsx_1.default)('str-chat__message-attachment-audio-widget--progress-track', className)} data-progress={progress} data-testid='audio-progress' onClick={onClick} role='progressbar' style={{
            '--str-chat__message-attachment-audio-widget-progress': progress + '%',
        }}>
    <div className='str-chat__message-attachment-audio-widget--progress-slider' style={{ left: "".concat(progress, "px") }}/>
  </div>);
};
exports.ProgressBar = ProgressBar;
