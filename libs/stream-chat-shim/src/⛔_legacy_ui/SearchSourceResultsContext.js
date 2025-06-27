"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchSourceResultsContext = exports.SearchSourceResultsContextProvider = exports.SearchSourceResultsContext = void 0;
var react_1 = require("react");
exports.SearchSourceResultsContext = (0, react_1.createContext)(undefined);
/**
 * Context provider for components rendered within the `SearchSourceResults`.
 */
var SearchSourceResultsContextProvider = function (_a) {
    var children = _a.children, value = _a.value;
    return (<exports.SearchSourceResultsContext.Provider value={value}>
    {children}
  </exports.SearchSourceResultsContext.Provider>);
};
exports.SearchSourceResultsContextProvider = SearchSourceResultsContextProvider;
var useSearchSourceResultsContext = function () {
    var contextValue = (0, react_1.useContext)(exports.SearchSourceResultsContext);
    return contextValue;
};
exports.useSearchSourceResultsContext = useSearchSourceResultsContext;
