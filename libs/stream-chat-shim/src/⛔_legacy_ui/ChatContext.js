"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatContext = exports.withChatContext = exports.useChatContext = exports.ChatProvider = void 0;
var react_1 = require("react");
var ChatContext = react_1.default.createContext(undefined);
exports.ChatContext = ChatContext;
var ChatProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<ChatContext.Provider value={value}>{children}</ChatContext.Provider>);
};
exports.ChatProvider = ChatProvider;
var useChatContext = function (componentName) {
    var contextValue = (0, react_1.useContext)(ChatContext);
    if (!contextValue) {
        console.warn("The useChatContext hook was called outside of the ChatContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ".concat(componentName, " component."));
        return {};
    }
    return contextValue;
};
exports.useChatContext = useChatContext;
var getDisplayName = function (Component) {
    return Component.displayName || Component.name || 'Component';
};
var withChatContext = function (Component) {
    var WithChatContextComponent = function (props) {
        var chatContext = (0, exports.useChatContext)();
        return <Component {...props} {...chatContext}/>;
    };
    WithChatContextComponent.displayName = "WithChatContext".concat(getDisplayName(Component));
    return WithChatContextComponent;
};
exports.withChatContext = withChatContext;
exports.default = ChatContext;
