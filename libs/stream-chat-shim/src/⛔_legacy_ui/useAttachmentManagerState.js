"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAttachmentManagerState = void 0;
var stream_chat_1 = require("stream-chat");
/**
 * Hook to access the current attachment manager state.
 *
 * @param manager - State store or object containing the attachment manager state.
 * @returns The latest attachment manager state from the provided store.
 */
var useAttachmentManagerState = function (manager) {
    var _a;
    var store = (_a = manager === null || manager === void 0 ? void 0 : manager.state) !== null && _a !== void 0 ? _a : manager;
    return (0, stream_chat_1.useStateStore)(store);
};
exports.useAttachmentManagerState = useAttachmentManagerState;
