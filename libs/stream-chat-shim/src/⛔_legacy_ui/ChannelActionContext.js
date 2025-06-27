"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelActionProvider = exports.useChannelActionContext = void 0;
var react_1 = require("react");
var ChannelActionContext = (0, react_1.createContext)({});
var useChannelActionContext = function () { return (0, react_1.useContext)(ChannelActionContext); };
exports.useChannelActionContext = useChannelActionContext;
var ChannelActionProvider = function (props) {
    var children = props.children, value = __rest(props, ["children"]);
    return (<ChannelActionContext.Provider value={value}>{children}</ChannelActionContext.Provider>);
};
exports.ChannelActionProvider = ChannelActionProvider;
exports.default = ChannelActionContext;
