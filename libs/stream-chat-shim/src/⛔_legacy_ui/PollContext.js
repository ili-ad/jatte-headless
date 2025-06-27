"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePollContext = exports.PollProvider = exports.PollContext = void 0;
var react_1 = require("react");
exports.PollContext = react_1.default.createContext(undefined);
var PollProvider = function (_a) {
    var children = _a.children, poll = _a.poll;
    return poll ? (<exports.PollContext.Provider value={{ poll: poll }}>
      {children}
    </exports.PollContext.Provider>) : null;
};
exports.PollProvider = PollProvider;
var usePollContext = function () {
    var contextValue = (0, react_1.useContext)(exports.PollContext);
    return contextValue;
};
exports.usePollContext = usePollContext;
exports.default = exports.PollContext;
