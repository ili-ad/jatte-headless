"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedAttachment = void 0;
var react_1 = require("react");
var ReactFileUtilities_1 = require("../ReactFileUtilities");
var context_1 = require("../../context");
var UnsupportedAttachment = function (_a) {
    var attachment = _a.attachment;
    var t = (0, context_1.useTranslationContext)('UnsupportedAttachment').t;
    return (<div className='str-chat__message-attachment-unsupported' data-testid='attachment-unsupported'>
      <ReactFileUtilities_1.FileIcon className='str-chat__file-icon'/>
      <div className='str-chat__message-attachment-unsupported__metadata'>
        <div className='str-chat__message-attachment-unsupported__title' data-testid='unsupported-attachment-title'>
          {attachment.title || t('Unsupported attachment')}
        </div>
      </div>
    </div>);
};
exports.UnsupportedAttachment = UnsupportedAttachment;
