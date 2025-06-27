"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderText = exports.defaultAllowedTagNames = void 0;
var react_1 = require("react");
var react_markdown_1 = require("react-markdown");
exports.defaultAllowedTagNames = [
    'p',
    'strong',
    'em',
    'a',
    'code',
    'pre',
];
/**
 * Minimal placeholder implementation of renderText.
 * Renders markdown using react-markdown without advanced plugins.
 */
var renderText = function (text, _mentionedUsers, _options) {
    if (_options === void 0) { _options = {}; }
    if (!text)
        return null;
    return <react_markdown_1.default skipHtml>{text}</react_markdown_1.default>;
};
exports.renderText = renderText;
exports.default = exports.renderText;
