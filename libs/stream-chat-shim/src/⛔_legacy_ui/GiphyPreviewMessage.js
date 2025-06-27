"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiphyPreviewMessage = void 0;
var react_1 = require("react");
/** Placeholder implementation of GiphyPreviewMessage component. */
var GiphyPreviewMessage = function (_a) {
    var message = _a.message;
    return (<div className="giphy-preview-message" data-testid="giphy-preview-message">
      {(message === null || message === void 0 ? void 0 : message.text) || 'Giphy preview'}
    </div>);
};
exports.GiphyPreviewMessage = GiphyPreviewMessage;
exports.default = exports.GiphyPreviewMessage;
