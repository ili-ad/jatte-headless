"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var attachment_sizing_1 = require("../src/components/Attachment/attachment-sizing");
describe('attachment-sizing helpers', function () {
    test('getImageAttachmentConfiguration returns url', function () {
        var el = document.createElement('div');
        el.style.height = '100px';
        el.style.maxWidth = '200px';
        var config = (0, attachment_sizing_1.getImageAttachmentConfiguration)({ image_url: 'https://example.com/img.png?oh=100&ow=100' }, el);
        expect(config.url).toContain('https://');
    });
    test('getVideoAttachmentConfiguration returns thumb url', function () {
        var el = document.createElement('div');
        el.style.height = '100px';
        el.style.maxWidth = '200px';
        var config = (0, attachment_sizing_1.getVideoAttachmentConfiguration)({
            thumb_url: 'https://example.com/thumb.png?oh=100&ow=100',
            asset_url: 'https://example.com/video.mp4',
        }, el, true);
        expect(config.thumbUrl).toContain('https://');
    });
});
