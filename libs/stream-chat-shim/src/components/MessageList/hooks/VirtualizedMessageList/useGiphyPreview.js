"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGiphyPreview = void 0;
var react_1 = require("react");
var ChatContext_1 = require("../../../../context/ChatContext");
var useGiphyPreview = function (separateGiphyPreview) {
    var _a = (0, react_1.useState)(), giphyPreviewMessage = _a[0], setGiphyPreviewMessage = _a[1];
    var client = (0, ChatContext_1.useChatContext)('useGiphyPreview').client;
    (0, react_1.useEffect)(function () {
        if (!separateGiphyPreview)
            return;
        var handleEvent = function (event) {
            var message = event.message, user = event.user;
            if ((message === null || message === void 0 ? void 0 : message.command) === 'giphy' && (user === null || user === void 0 ? void 0 : user.id) === client.userID) {
                setGiphyPreviewMessage(undefined);
            }
        };
        /* TODO backend-wire-up: client.on */
        return function () { /* TODO backend-wire-up: client.off */ };
    }, [client, separateGiphyPreview]);
    return {
        giphyPreviewMessage: giphyPreviewMessage,
        setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
    };
};
exports.useGiphyPreview = useGiphyPreview;
