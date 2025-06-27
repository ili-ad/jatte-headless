"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingErrorIndicator = void 0;
var react_1 = require("react");
var TranslationContext_1 = require("../../context/TranslationContext");
/**
 * UI component for error indicator in a Channel
 */
var UnMemoizedLoadingErrorIndicator = function (_a) {
    var error = _a.error;
    var t = (0, TranslationContext_1.useTranslationContext)('LoadingErrorIndicator').t;
    if (!error)
        return null;
    return <div>{t('Error: {{ errorMessage }}', { errorMessage: error.message })}</div>;
};
exports.LoadingErrorIndicator = react_1.default.memo(UnMemoizedLoadingErrorIndicator, function (prevProps, nextProps) { var _a, _b; return ((_a = prevProps.error) === null || _a === void 0 ? void 0 : _a.message) === ((_b = nextProps.error) === null || _b === void 0 ? void 0 : _b.message); });
