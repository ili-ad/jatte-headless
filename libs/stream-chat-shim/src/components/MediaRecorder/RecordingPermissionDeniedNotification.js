"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingPermissionDeniedNotification = void 0;
var react_1 = require("react");
var context_1 = require("../../context");
var RecordingPermissionDeniedNotification = function (_a) {
    var onClose = _a.onClose, permissionName = _a.permissionName;
    var t = (0, context_1.useTranslationContext)().t;
    var permissionTranslations = {
        body: {
            camera: t('To start recording, allow the camera access in your browser'),
            microphone: t('To start recording, allow the microphone access in your browser'),
        },
        heading: {
            camera: t('Allow access to camera'),
            microphone: t('Allow access to microphone'),
        },
    };
    return (<div className='str-chat__recording-permission-denied-notification'>
      <div className='str-chat__recording-permission-denied-notification__heading'>
        {permissionTranslations.heading[permissionName]}
      </div>
      <p className='str-chat__recording-permission-denied-notification__message'>
        {permissionTranslations.body[permissionName]}
      </p>
      <div className='str-chat__recording-permission-denied-notification__dismiss-button-container'>
        <button className='str-chat__recording-permission-denied-notification__dismiss-button' onClick={onClose}>
          {t('Ok')}
        </button>
      </div>
    </div>);
};
exports.RecordingPermissionDeniedNotification = RecordingPermissionDeniedNotification;
