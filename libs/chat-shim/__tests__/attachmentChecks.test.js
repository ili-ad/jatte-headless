"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('attachment type helpers', function () {
    test('isImageAttachment', function () {
        expect((0, index_1.isImageAttachment)({ mime_type: 'image/png' })).toBe(true);
        expect((0, index_1.isImageAttachment)({ name: 'photo.JPG' })).toBe(true);
        expect((0, index_1.isImageAttachment)({ mime_type: 'video/mp4' })).toBe(false);
    });
    test('isVideoAttachment', function () {
        expect((0, index_1.isVideoAttachment)({ mime_type: 'video/mp4' })).toBe(true);
        expect((0, index_1.isVideoAttachment)({ name: 'clip.webm' })).toBe(true);
        expect((0, index_1.isVideoAttachment)({ mime_type: 'audio/mp3' })).toBe(false);
    });
    test('isAudioAttachment', function () {
        expect((0, index_1.isAudioAttachment)({ mime_type: 'audio/mpeg' })).toBe(true);
        expect((0, index_1.isAudioAttachment)({ name: 'sound.wav' })).toBe(true);
        expect((0, index_1.isAudioAttachment)({ mime_type: 'image/png' })).toBe(false);
    });
});
