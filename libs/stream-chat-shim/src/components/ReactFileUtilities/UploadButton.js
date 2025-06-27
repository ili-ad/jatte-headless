"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadFileInput = exports.FileInput = exports.UploadButton = void 0;
var clsx_1 = require("clsx");
var nanoid_1 = require("nanoid");
var react_1 = require("react");
var utils_1 = require("./utils");
var context_1 = require("../../context");
var MessageInput_1 = require("../MessageInput");
var useAttachmentManagerState_1 = require("../MessageInput/hooks/useAttachmentManagerState");
var store_1 = require("../../store");
var attachmentManagerConfigStateSelector = function (state) { return ({
    acceptedFiles: state.attachments.acceptedFiles,
    maxNumberOfFilesPerMessage: state.attachments.maxNumberOfFilesPerMessage,
}); };
/**
 * @deprecated Use FileInput instead
 */
exports.UploadButton = (0, react_1.forwardRef)(function UploadButton(_a, ref) {
    var onFileChange = _a.onFileChange, _b = _a.resetOnChange, resetOnChange = _b === void 0 ? true : _b, rest = __rest(_a, ["onFileChange", "resetOnChange"]);
    var handleInputChange = (0, utils_1.useHandleFileChangeWrapper)(resetOnChange, onFileChange);
    return <input onChange={handleInputChange} ref={ref} type='file' {...rest}/>;
});
exports.FileInput = exports.UploadButton;
exports.UploadFileInput = (0, react_1.forwardRef)(function UploadFileInput(_a, ref) {
    var className = _a.className, onFileChangeCustom = _a.onFileChange, props = __rest(_a, ["className", "onFileChange"]);
    var t = (0, context_1.useTranslationContext)('UploadFileInput').t;
    var cooldownRemaining = (0, context_1.useMessageInputContext)().cooldownRemaining;
    var messageComposer = (0, MessageInput_1.useMessageComposer)();
    var attachmentManager = messageComposer.attachmentManager;
    var isUploadEnabled = (0, useAttachmentManagerState_1.useAttachmentManagerState)().isUploadEnabled;
    var _b = (0, store_1.useStateStore)(messageComposer.configState, attachmentManagerConfigStateSelector), acceptedFiles = _b.acceptedFiles, maxNumberOfFilesPerMessage = _b.maxNumberOfFilesPerMessage;
    var id = (0, react_1.useMemo)(function () { return (0, nanoid_1.nanoid)(); }, []);
    var onFileChange = (0, react_1.useCallback)(function (files) {
        attachmentManager.uploadFiles(files);
        onFileChangeCustom === null || onFileChangeCustom === void 0 ? void 0 : onFileChangeCustom(files);
    }, [onFileChangeCustom, attachmentManager]);
    return (<exports.FileInput accept={acceptedFiles === null || acceptedFiles === void 0 ? void 0 : acceptedFiles.join(',')} aria-label={t('aria/File upload')} data-testid='file-input' disabled={!isUploadEnabled || !!cooldownRemaining} id={id} multiple={maxNumberOfFilesPerMessage > 1} {...props} className={(0, clsx_1.default)('str-chat__file-input', className)} onFileChange={onFileChange} ref={ref}/>);
});
