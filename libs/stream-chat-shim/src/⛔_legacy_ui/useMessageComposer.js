"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageComposer = void 0;
var react_1 = require("react");
var stream_chat_1 = require("stream-chat");
/**
 * Lightweight placeholder for Stream's `useMessageComposer` hook.
 *
 * Returns a new {@link MessageComposer} instance. In the real
 * implementation this hook would integrate with chat contexts
 * to return the composer for the current channel or thread.
 */
var useMessageComposer = function () {
    var composer = (0, react_1.useMemo)(function () { return new stream_chat_1.MessageComposer(); }, []);
    (0, react_1.useEffect)(function () {
        // TODO: register subscriptions with the Stream Chat client
    }, [composer]);
    return composer;
};
exports.useMessageComposer = useMessageComposer;
exports.default = exports.useMessageComposer;
