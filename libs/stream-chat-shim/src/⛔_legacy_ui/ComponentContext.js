"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComponentContext = exports.ComponentProvider = exports.ComponentContext = void 0;
var react_1 = require("react");
exports.ComponentContext = (0, react_1.createContext)({});
var ComponentProvider = function (_a) {
    var value = _a.value, children = _a.children;
    return (<exports.ComponentContext.Provider value={value}>
    {children}
  </exports.ComponentContext.Provider>);
};
exports.ComponentProvider = ComponentProvider;
/** Access the current ComponentContext. */
var useComponentContext = function () { return (0, react_1.useContext)(exports.ComponentContext); };
exports.useComponentContext = useComponentContext;
exports.default = exports.ComponentContext;
