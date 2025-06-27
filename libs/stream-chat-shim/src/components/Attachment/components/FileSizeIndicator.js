"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSizeIndicator = void 0;
var react_1 = require("react");
var utils_1 = require("../../MessageInput/hooks/utils");
var FileSizeIndicator = function (_a) {
    var fileSize = _a.fileSize, maximumFractionDigits = _a.maximumFractionDigits;
    var actualFileSize = typeof fileSize === 'string' ? parseFloat(fileSize) : fileSize;
    if (typeof actualFileSize === 'undefined' || !Number.isFinite(Number(actualFileSize))) {
        return null;
    }
    return (<span className='str-chat__message-attachment-file--item-size' data-testid='file-size-indicator'>
      {(0, utils_1.prettifyFileSize)(actualFileSize, maximumFractionDigits)}
    </span>);
};
exports.FileSizeIndicator = FileSizeIndicator;
