"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iconMap = void 0;
var fileIconSet = require("./FileIconSet");
var mimeTypes_1 = require("./mimeTypes");
function generateMimeTypeToIconMap(_a) {
    var FileArchiveIcon = _a.FileArchiveIcon, FileCodeIcon = _a.FileCodeIcon, FileExcelIcon = _a.FileExcelIcon, FilePdfIcon = _a.FilePdfIcon, FilePowerPointIcon = _a.FilePowerPointIcon, FileWordIcon = _a.FileWordIcon;
    var mimeTypeToIconMap = {
        'application/pdf': FilePdfIcon,
    };
    for (var _i = 0, wordMimeTypes_1 = mimeTypes_1.wordMimeTypes; _i < wordMimeTypes_1.length; _i++) {
        var type = wordMimeTypes_1[_i];
        mimeTypeToIconMap[type] = FileWordIcon;
    }
    for (var _b = 0, excelMimeTypes_1 = mimeTypes_1.excelMimeTypes; _b < excelMimeTypes_1.length; _b++) {
        var type = excelMimeTypes_1[_b];
        mimeTypeToIconMap[type] = FileExcelIcon;
    }
    for (var _c = 0, powerpointMimeTypes_1 = mimeTypes_1.powerpointMimeTypes; _c < powerpointMimeTypes_1.length; _c++) {
        var type = powerpointMimeTypes_1[_c];
        mimeTypeToIconMap[type] = FilePowerPointIcon;
    }
    for (var _d = 0, archiveFileTypes_1 = mimeTypes_1.archiveFileTypes; _d < archiveFileTypes_1.length; _d++) {
        var type = archiveFileTypes_1[_d];
        mimeTypeToIconMap[type] = FileArchiveIcon;
    }
    for (var _e = 0, codeFileTypes_1 = mimeTypes_1.codeFileTypes; _e < codeFileTypes_1.length; _e++) {
        var type = codeFileTypes_1[_e];
        mimeTypeToIconMap[type] = FileCodeIcon;
    }
    return mimeTypeToIconMap;
}
function generateGeneralTypeToIconMap(_a) {
    var FileAltIcon = _a.FileAltIcon, FileAudioIcon = _a.FileAudioIcon, FileImageIcon = _a.FileImageIcon, FileVideoIcon = _a.FileVideoIcon;
    return {
        'audio/': FileAudioIcon,
        'image/': FileImageIcon,
        'text/': FileAltIcon,
        'video/': FileVideoIcon,
    };
}
exports.iconMap = {
    alt: __assign(__assign(__assign({}, generateMimeTypeToIconMap({
        FileArchiveIcon: fileIconSet.FileArchiveIconAlt,
        FileCodeIcon: fileIconSet.FileCodeIconAlt,
        FileExcelIcon: fileIconSet.FileExcelIconAlt,
        FilePdfIcon: fileIconSet.FilePdfIcon,
        FilePowerPointIcon: fileIconSet.FilePowerPointIconAlt,
        FileWordIcon: fileIconSet.FileWordIconAlt,
    })), generateGeneralTypeToIconMap({
        FileAltIcon: fileIconSet.FileFallbackIcon,
        FileAudioIcon: fileIconSet.FileAudioIconAlt,
        FileImageIcon: fileIconSet.FileImageIcon,
        FileVideoIcon: fileIconSet.FileVideoIconAlt,
    })), { fallback: fileIconSet.FileFallbackIcon }),
    standard: __assign(__assign(__assign({}, generateMimeTypeToIconMap({
        FileArchiveIcon: fileIconSet.FileArchiveIcon,
        FileCodeIcon: fileIconSet.FileCodeIcon,
        FileExcelIcon: fileIconSet.FileExcelIcon,
        FilePdfIcon: fileIconSet.FilePdfIcon,
        FilePowerPointIcon: fileIconSet.FilePowerPointIcon,
        FileWordIcon: fileIconSet.FileWordIcon,
    })), generateGeneralTypeToIconMap({
        FileAltIcon: fileIconSet.FileFallbackIcon,
        FileAudioIcon: fileIconSet.FileAudioIcon,
        FileImageIcon: fileIconSet.FileImageIcon,
        FileVideoIcon: fileIconSet.FileVideoIcon,
    })), { fallback: fileIconSet.FileFallbackIcon }),
};
