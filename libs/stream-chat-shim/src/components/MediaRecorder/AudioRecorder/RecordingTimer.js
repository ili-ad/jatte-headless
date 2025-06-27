"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingTimer = void 0;
var clsx_1 = require("clsx");
var Attachment_1 = require("../../Attachment");
var react_1 = require("react");
var RecordingTimer = function (_a) {
    var durationSeconds = _a.durationSeconds;
    return (<div className={(0, clsx_1.default)('str-chat__recording-timer', {
            'str-chat__recording-timer--hours': durationSeconds >= 3600,
        })}>
    {(0, Attachment_1.displayDuration)(durationSeconds)}
  </div>);
};
exports.RecordingTimer = RecordingTimer;
