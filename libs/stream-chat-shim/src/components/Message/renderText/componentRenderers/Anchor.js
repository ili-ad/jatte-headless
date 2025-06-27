"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anchor = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var Anchor = function (_a) {
    var children = _a.children, href = _a.href;
    var isEmail = href === null || href === void 0 ? void 0 : href.startsWith('mailto:');
    var isUrl = href === null || href === void 0 ? void 0 : href.startsWith('http');
    if (!href || (!isEmail && !isUrl))
        return <>{children}</>;
    return (<a className={(0, clsx_1.default)({ 'str-chat__message-url-link': isUrl })} href={href} rel='nofollow noreferrer noopener' target='_blank'>
      {children}
    </a>);
};
exports.Anchor = Anchor;
