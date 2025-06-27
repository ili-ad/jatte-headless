"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlToTextPlugin = void 0;
var unist_util_visit_1 = require("unist-util-visit");
var visitor = function (node) {
    if (node.type !== 'html')
        return;
    node.type = 'text';
};
var transform = function (tree) {
    (0, unist_util_visit_1.visit)(tree, visitor);
};
var htmlToTextPlugin = function () { return transform; };
exports.htmlToTextPlugin = htmlToTextPlugin;
