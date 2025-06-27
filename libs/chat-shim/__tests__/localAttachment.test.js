"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('local attachment helpers', function () {
    var makeFile = function (name, type) { return new File(['x'], name, { type: type }); };
    test('isLocalAttachment via file or state', function () {
        expect((0, index_1.isLocalAttachment)({ file: makeFile('a.png', 'image/png') })).toBe(true);
        expect((0, index_1.isLocalAttachment)({ state: 'uploading' })).toBe(true);
        expect((0, index_1.isLocalAttachment)({})).toBe(false);
    });
    test('isLocalUploadAttachment checks uploading state', function () {
        expect((0, index_1.isLocalUploadAttachment)({ state: 'uploading' })).toBe(true);
        expect((0, index_1.isLocalUploadAttachment)({ file: makeFile('a.txt', 'text/plain') })).toBe(false);
    });
    test('isLocalImageAttachment', function () {
        expect((0, index_1.isLocalImageAttachment)({ file: makeFile('pic.gif', 'image/gif') })).toBe(true);
    });
    test('isLocalVideoAttachment', function () {
        expect((0, index_1.isLocalVideoAttachment)({ file: makeFile('clip.webm', 'video/webm') })).toBe(true);
    });
    test('isLocalAudioAttachment', function () {
        expect((0, index_1.isLocalAudioAttachment)({ file: makeFile('sound.mp3', 'audio/mp3') })).toBe(true);
    });
    test('isLocalVoiceRecordingAttachment', function () {
        expect((0, index_1.isLocalVoiceRecordingAttachment)({ file: makeFile('rec.wav', 'audio/wav'), waveform: [] })).toBe(true);
    });
    test('isLocalFileAttachment acts as fallback', function () {
        expect((0, index_1.isLocalFileAttachment)({ file: makeFile('doc.pdf', 'application/pdf') })).toBe(true);
    });
});
