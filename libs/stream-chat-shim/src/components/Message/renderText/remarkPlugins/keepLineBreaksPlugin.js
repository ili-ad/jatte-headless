"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepLineBreaksPlugin = void 0;
var unist_util_visit_1 = require("unist-util-visit");
var unist_builder_1 = require("unist-builder");
var visitor = function (node, index, parent) {
    if (!(index && parent && node.position))
        return;
    var prevSibling = parent.children.at(index - 1);
    if (!(prevSibling === null || prevSibling === void 0 ? void 0 : prevSibling.position))
        return;
    if (node.position.start.line === prevSibling.position.start.line)
        return;
    var ownStartLine = node.position.start.line;
    var prevEndLine = prevSibling.position.end.line;
    // the -1 is adjustment for the single line break into which multiple line breaks are converted
    var countTruncatedLineBreaks = ownStartLine - prevEndLine - 1;
    if (countTruncatedLineBreaks < 1)
        return;
    var lineBreaks = Array.from({ length: countTruncatedLineBreaks }, function () { return (0, unist_builder_1.u)('break', { tagName: 'br' }); });
    parent.children = __spreadArray(__spreadArray(__spreadArray([], parent.children.slice(0, index), true), lineBreaks, true), parent.children.slice(index), true);
    return;
};
var transform = function (tree) {
    (0, unist_util_visit_1.visit)(tree, visitor);
};
var keepLineBreaksPlugin = function () { return transform; };
exports.keepLineBreaksPlugin = keepLineBreaksPlugin;
