"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelListContext = exports.ChannelListContext = void 0;
var react_1 = require("react");
/** React context used to share channel list state */
exports.ChannelListContext = (0, react_1.createContext)({
    channels: [],
    loading: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setActiveChannel: function () { },
});
var useChannelListContext = function () { return (0, react_1.useContext)(exports.ChannelListContext); };
exports.useChannelListContext = useChannelListContext;
exports.default = exports.ChannelListContext;
