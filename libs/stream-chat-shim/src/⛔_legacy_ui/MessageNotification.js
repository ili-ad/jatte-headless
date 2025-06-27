"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageNotification = void 0;
var react_1 = require("react");
/** Minimal placeholder implementation of Stream's `MessageNotification` component. */
var MessageNotification = function (props) {
    var children = props.children, onClick = props.onClick, _a = props.showNotification, showNotification = _a === void 0 ? true : _a;
    if (!showNotification)
        return null;
    return (<button aria-live="polite" className="str-chat__message-notification" data-testid="message-notification" onClick={onClick}>
      {children || 'New Messages'}
    </button>);
};
exports.MessageNotification = MessageNotification;
exports.default = exports.MessageNotification;
