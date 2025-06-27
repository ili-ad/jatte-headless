"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBounceProvider = exports.useMessageBounceContext = void 0;
var react_1 = require("react");
var defaultValue = {
    handleDelete: function () {
        throw new Error('handleDelete not implemented');
    },
    handleEdit: function () {
        throw new Error('handleEdit not implemented');
    },
    handleRetry: function () {
        throw new Error('handleRetry not implemented');
    },
    message: undefined,
};
var MessageBounceContext = (0, react_1.createContext)(defaultValue);
/**
 * Shim implementation of Stream's `useMessageBounceContext` hook.
 */
var useMessageBounceContext = function (componentName) {
    var contextValue = (0, react_1.useContext)(MessageBounceContext);
    if (contextValue === defaultValue) {
        console.warn("The useMessageBounceContext hook was called outside of the MessageBounceContext provider." +
            (componentName ? " The errored call is located in the ".concat(componentName, " component.") : ''));
    }
    return contextValue;
};
exports.useMessageBounceContext = useMessageBounceContext;
/**
 * Shim implementation of the `MessageBounceProvider` component.
 */
var MessageBounceProvider = function (_a) {
    var children = _a.children;
    return (<MessageBounceContext.Provider value={defaultValue}>
      {children}
    </MessageBounceContext.Provider>);
};
exports.MessageBounceProvider = MessageBounceProvider;
exports.default = MessageBounceContext;
