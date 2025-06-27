"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadButton = void 0;
var react_1 = require("react");
var icons_1 = require("../icons");
var SafeAnchor_1 = require("../../SafeAnchor");
var DownloadButton = function (_a) {
    var assetUrl = _a.assetUrl;
    return (<SafeAnchor_1.SafeAnchor className='str-chat__message-attachment-file--item-download' download href={assetUrl} target='_blank'>
    <icons_1.DownloadIcon className='str-chat__message-attachment-download-icon'/>
  </SafeAnchor_1.SafeAnchor>);
};
exports.DownloadButton = DownloadButton;
