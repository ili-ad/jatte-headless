"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchContext = exports.SearchContextProvider = exports.SearchContext = void 0;
var react_1 = require("react");
exports.SearchContext = (0, react_1.createContext)(undefined);
/**
 * Context provider for components rendered within the `Search` component
 */
var SearchContextProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<exports.SearchContext.Provider value={value}>
    {children}
  </exports.SearchContext.Provider>);
};
exports.SearchContextProvider = SearchContextProvider;
var useSearchContext = function () {
    var contextValue = (0, react_1.useContext)(exports.SearchContext);
    return contextValue;
};
exports.useSearchContext = useSearchContext;
exports.default = exports.SearchContext;
