"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomNotification = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var UnMemoizedCustomNotification = function (props) {
    var active = props.active, children = props.children, className = props.className, type = props.type;
    if (!active)
        return null;
    return (<div aria-live='polite' className={(0, clsx_1.default)("str-chat__custom-notification notification-".concat(type), "str-chat__notification", "str-chat-react__notification", className)} data-testid='custom-notification'>
      {children}
    </div>);
};
exports.CustomNotification = react_1.default.memo(UnMemoizedCustomNotification);
