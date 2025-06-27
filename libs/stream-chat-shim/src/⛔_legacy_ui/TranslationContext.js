"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTranslationContext = exports.useTranslationContext = exports.TranslationProvider = exports.TranslationContext = void 0;
var react_1 = require("react");
exports.TranslationContext = (0, react_1.createContext)({
    t: function (key) { return key; },
    tDateTimeParser: function (input) { return new Date(input); },
    userLanguage: 'en',
});
var TranslationProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<exports.TranslationContext.Provider value={value}>{children}</exports.TranslationContext.Provider>);
};
exports.TranslationProvider = TranslationProvider;
var useTranslationContext = function (_componentName) { return (0, react_1.useContext)(exports.TranslationContext); };
exports.useTranslationContext = useTranslationContext;
var withTranslationContext = function (Component) {
    var WithTranslationContextComponent = function (props) {
        var translationContext = (0, exports.useTranslationContext)();
        return <Component {...props} {...translationContext}/>;
    };
    WithTranslationContextComponent.displayName = "WithTranslationContext(".concat(Component.displayName || Component.name || 'Component', ")");
    return WithTranslationContextComponent;
};
exports.withTranslationContext = withTranslationContext;
exports.default = exports.TranslationContext;
