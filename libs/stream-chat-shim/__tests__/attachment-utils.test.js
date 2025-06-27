"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var attachment_utils_1 = require("../src/attachment-utils");
describe('attachment-utils', function () {
    test('displayDuration formats seconds', function () {
        expect((0, attachment_utils_1.displayDuration)(0)).toBe('00:00');
        expect((0, attachment_utils_1.displayDuration)(70)).toBe('01:10');
        expect((0, attachment_utils_1.displayDuration)(3661)).toBe('01:01:01');
    });
    test('isGalleryAttachmentType detects gallery', function () {
        var gallery = { images: [], type: 'gallery' };
        expect((0, attachment_utils_1.isGalleryAttachmentType)(gallery)).toBe(true);
        expect((0, attachment_utils_1.isGalleryAttachmentType)({})).toBe(false);
    });
    test('SUPPORTED_VIDEO_FORMATS has common formats', function () {
        expect(attachment_utils_1.SUPPORTED_VIDEO_FORMATS).toContain('video/mp4');
    });
});
