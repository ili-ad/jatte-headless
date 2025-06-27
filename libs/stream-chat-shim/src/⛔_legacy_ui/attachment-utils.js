"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayDuration = exports.divMod = exports.isSvgAttachment = exports.isGalleryAttachmentType = exports.SUPPORTED_VIDEO_FORMATS = void 0;
exports.SUPPORTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/ogg',
    'video/webm',
    'video/quicktime',
];
var isGalleryAttachmentType = function (attachment) {
    return Array.isArray(attachment.images);
};
exports.isGalleryAttachmentType = isGalleryAttachmentType;
var isSvgAttachment = function (attachment) {
    var filename = attachment.fallback || '';
    return filename.toLowerCase().endsWith('.svg');
};
exports.isSvgAttachment = isSvgAttachment;
var divMod = function (num, divisor) { return [
    Math.floor(num / divisor),
    num % divisor,
]; };
exports.divMod = divMod;
var displayDuration = function (totalSeconds) {
    if (!totalSeconds || totalSeconds < 0)
        return '00:00';
    var _a = (0, exports.divMod)(totalSeconds, 3600), hours = _a[0], hoursLeftover = _a[1];
    var _b = (0, exports.divMod)(hoursLeftover, 60), minutes = _b[0], seconds = _b[1];
    var roundedSeconds = Math.ceil(seconds);
    var prependHrsZero = hours.toString().length === 1 ? '0' : '';
    var prependMinZero = minutes.toString().length === 1 ? '0' : '';
    var prependSecZero = roundedSeconds.toString().length === 1 ? '0' : '';
    var minSec = "".concat(prependMinZero).concat(minutes, ":").concat(prependSecZero).concat(roundedSeconds);
    return hours ? "".concat(prependHrsZero).concat(hours, ":") + minSec : minSec;
};
exports.displayDuration = displayDuration;
