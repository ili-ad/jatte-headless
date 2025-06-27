"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLegacyThreadContext = exports.LegacyThreadContext = void 0;
var react_1 = require("react");
exports.LegacyThreadContext = react_1.default.createContext({ legacyThread: undefined });
var useLegacyThreadContext = function () { return (0, react_1.useContext)(exports.LegacyThreadContext); };
exports.useLegacyThreadContext = useLegacyThreadContext;
