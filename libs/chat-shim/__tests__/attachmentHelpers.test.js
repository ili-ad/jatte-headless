"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('attachment helpers', function () {
    test('detect scraped content', function () {
        expect((0, index_1.isScrapedContent)({ og_scrape_url: 'http://x' })).toBe(true);
        expect((0, index_1.isScrapedContent)({})).toBe(false);
    });
    test('file vs media detection', function () {
        expect((0, index_1.isFileAttachment)({ mime_type: 'image/png' })).toBe(false);
        expect((0, index_1.isFileAttachment)({ mime_type: 'video/mp4' })).toBe(false);
        expect((0, index_1.isFileAttachment)({ mime_type: 'audio/mp3' })).toBe(false);
        expect((0, index_1.isFileAttachment)({ og_scrape_url: 'http://x' })).toBe(false);
        expect((0, index_1.isFileAttachment)({ mime_type: 'application/pdf' })).toBe(true);
    });
});
