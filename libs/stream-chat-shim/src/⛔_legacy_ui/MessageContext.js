"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMessageContext = exports.useMessageContext = exports.MessageProvider = exports.MessageContext = void 0;
var react_1 = require("react");
exports.MessageContext = (0, react_1.createContext)(undefined);
var MessageProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<exports.MessageContext.Provider value={value}>{children}</exports.MessageContext.Provider>);
};
exports.MessageProvider = MessageProvider;
var useMessageContext = function () {
    var contextValue = (0, react_1.useContext)(exports.MessageContext);
    if (!contextValue)
        return {};
    return contextValue;
};
exports.useMessageContext = useMessageContext;
var withMessageContext = function (Component) {
    var WithMessageContextComponent = function (props) {
        var messageContext = (0, exports.useMessageContext)();
        return <Component {...props} {...messageContext}/>;
    };
    WithMessageContextComponent.displayName = (Component.displayName || Component.name || 'Component').replace('Base', '');
    return WithMessageContextComponent;
};
exports.withMessageContext = withMessageContext;
