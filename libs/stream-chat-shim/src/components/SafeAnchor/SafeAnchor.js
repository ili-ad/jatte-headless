"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeAnchor = void 0;
var react_1 = require("react");
var sanitize_url_1 = require("@braintree/sanitize-url");
var context_1 = require("../../context");
var UnMemoizedSafeAnchor = function (props) {
    var children = props.children, className = props.className, download = props.download, href = props.href, rel = props.rel, target = props.target;
    var t = (0, context_1.useTranslationContext)('SafeAnchor').t;
    if (!href)
        return null;
    var sanitized = (0, sanitize_url_1.sanitizeUrl)(href);
    return (<a aria-label={t('aria/Attachment')} className={className} download={download} href={sanitized} rel={rel} target={target}>
      {children}
    </a>);
};
exports.SafeAnchor = react_1.default.memo(UnMemoizedSafeAnchor);
