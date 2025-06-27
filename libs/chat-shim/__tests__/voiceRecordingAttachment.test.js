"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="jest" />
var index_1 = require("../index");
describe('isVoiceRecordingAttachment', function () {
    it('detects audio attachments with waveform', function () {
        var a = { mime_type: 'audio/mpeg', waveform: [0, 1, 0] };
        expect((0, index_1.isVoiceRecordingAttachment)(a)).toBe(true);
    });
    it('rejects audio attachments without waveform', function () {
        var a = { mime_type: 'audio/wav' };
        expect((0, index_1.isVoiceRecordingAttachment)(a)).toBe(false);
    });
    it('rejects non-audio attachments even with waveform', function () {
        var a = { mime_type: 'video/mp4', waveform: [0] };
        expect((0, index_1.isVoiceRecordingAttachment)(a)).toBe(false);
    });
});
