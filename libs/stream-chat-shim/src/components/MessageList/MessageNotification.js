"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageNotification = void 0;
var react_1 = require("react");
var UnMemoizedMessageNotification = function (props) {
    var children = props.children, onClick = props.onClick, _a = props.showNotification, showNotification = _a === void 0 ? true : _a;
    if (!showNotification)
        return null;
    return (<button aria-live='polite' className={"str-chat__message-notification"} data-testid='message-notification' onClick={onClick}>
      {children}
    </button>);
};
exports.MessageNotification = react_1.default.memo(UnMemoizedMessageNotification);
