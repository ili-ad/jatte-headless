"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseIcon = void 0;
var react_1 = require("react");
var TranslationContext_1 = require("../../context/TranslationContext");
var CloseIcon = function (_a) {
    var title = _a.title;
    var t = (0, TranslationContext_1.useTranslationContext)('CloseIcon').t;
    return (<svg data-testid='close-no-outline' fill='none' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <title>{title !== null && title !== void 0 ? title : t('Close')}</title>
      <path d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z' fill='black'/>
    </svg>);
};
exports.CloseIcon = CloseIcon;
