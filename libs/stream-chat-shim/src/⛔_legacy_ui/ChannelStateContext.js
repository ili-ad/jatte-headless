"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withChannelStateContext = exports.useChannelStateContext = exports.ChannelStateProvider = exports.ChannelStateContext = void 0;
var react_1 = require("react");
exports.ChannelStateContext = (0, react_1.createContext)(undefined);
var ChannelStateProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<exports.ChannelStateContext.Provider value={value}>{children}</exports.ChannelStateContext.Provider>);
};
exports.ChannelStateProvider = ChannelStateProvider;
var useChannelStateContext = function (componentName) {
    var contextValue = (0, react_1.useContext)(exports.ChannelStateContext);
    if (!contextValue) {
        console.warn("The useChannelStateContext hook was called outside of the ChannelStateContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ".concat(componentName, " component."));
        return {};
    }
    return contextValue;
};
exports.useChannelStateContext = useChannelStateContext;
var withChannelStateContext = function (Component) {
    var WithChannelStateContextComponent = function (props) {
        var channelStateContext = (0, exports.useChannelStateContext)();
        return <Component {...props} {...channelStateContext}/>;
    };
    WithChannelStateContextComponent.displayName = (Component.displayName || Component.name || 'Component').replace('Base', '');
    return WithChannelStateContextComponent;
};
exports.withChannelStateContext = withChannelStateContext;
exports.default = exports.ChannelStateContext;
