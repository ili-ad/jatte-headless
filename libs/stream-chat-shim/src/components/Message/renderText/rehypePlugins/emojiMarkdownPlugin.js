"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emojiMarkdownPlugin = void 0;
var hast_util_find_and_replace_1 = require("hast-util-find-and-replace");
var unist_builder_1 = require("unist-builder");
var emoji_regex_1 = require("emoji-regex");
var emojiMarkdownPlugin = function () {
    var replace = function (match) {
        return (0, unist_builder_1.u)('element', { properties: {}, tagName: 'emoji' }, [(0, unist_builder_1.u)('text', match)]);
    };
    var transform = function (node) { return (0, hast_util_find_and_replace_1.findAndReplace)(node, [(0, emoji_regex_1.default)(), replace]); };
    return transform;
};
exports.emojiMarkdownPlugin = emojiMarkdownPlugin;
