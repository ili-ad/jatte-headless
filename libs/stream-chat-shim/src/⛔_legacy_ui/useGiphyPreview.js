"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGiphyPreview = void 0;
var react_1 = require("react");
/**
 * Hook managing the giphy preview message state.
 *
 * This shim provides a minimal implementation and does not yet integrate
 * with the Stream Chat client. The API matches the real hook so it can be
 * wired up later without refactors.
 */
var useGiphyPreview = function (separateGiphyPreview) {
    var _a = (0, react_1.useState)(), giphyPreviewMessage = _a[0], setGiphyPreviewMessage = _a[1];
    (0, react_1.useEffect)(function () {
        if (!separateGiphyPreview)
            return;
        // TODO: connect to Stream Chat client's `message.new` events
        // to clear the preview when a giphy message is sent.
        var handleEvent = function () { };
        return function () {
            void handleEvent;
        };
    }, [separateGiphyPreview]);
    return {
        giphyPreviewMessage: giphyPreviewMessage,
        setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
    };
};
exports.useGiphyPreview = useGiphyPreview;
