"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelListShape = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation for Stream's `useChannelListShape` hook.
 * Registers an effect with the provided event handler but does not
 * connect to a real Stream Chat client.
 */
var useChannelListShape = function (handler) {
    (0, react_1.useEffect)(function () {
        // TODO: integrate with Stream Chat client's event system
    }, [handler]);
};
exports.useChannelListShape = useChannelListShape;
