"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTypingContext = exports.useTypingContext = exports.TypingProvider = exports.TypingContext = void 0;
var react_1 = require("react");
exports.TypingContext = react_1.default.createContext(undefined);
var TypingProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<exports.TypingContext.Provider value={value}>{children}</exports.TypingContext.Provider>);
};
exports.TypingProvider = TypingProvider;
var useTypingContext = function (componentName) {
    var contextValue = (0, react_1.useContext)(exports.TypingContext);
    if (!contextValue) {
        console.warn("The useTypingContext hook was called outside of the TypingContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ".concat(componentName, " component."));
        return {};
    }
    return contextValue;
};
exports.useTypingContext = useTypingContext;
/**
 * Typescript currently does not support partial inference, so if TypingContext typing is desired while using the HOC withTypingContext,
 * the Props for the wrapped component must be provided as the first generic.
 */
var withTypingContext = function (Component) {
    var WithTypingContextComponent = function (props) {
        var typingContext = (0, exports.useTypingContext)();
        return <Component {...props} {...typingContext}/>;
    };
    WithTypingContextComponent.displayName = (Component.displayName || Component.name || 'Component').replace('Base', '');
    return WithTypingContextComponent;
};
exports.withTypingContext = withTypingContext;
