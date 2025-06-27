"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchMarkdownLinks = exports.messageCodeBlocks = exports.detectHttp = void 0;
exports.escapeRegExp = escapeRegExp;
function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}
exports.detectHttp = /(http(s?):\/\/)?(www\.)?/;
var messageCodeBlocks = function (message) {
    var codeRegex = /```[a-z]*\n[\s\S]*?\n```|`[a-z]*[\s\S]*?`/gm;
    var matches = message.match(codeRegex);
    return matches || [];
};
exports.messageCodeBlocks = messageCodeBlocks;
var matchMarkdownLinks = function (message) {
    var regexMdLinks = /\[([^[]+)\](\(.*\))/gm;
    var matches = message.match(regexMdLinks);
    var singleMatch = /\[([^[]+)\]\((.*)\)/;
    var links = matches
        ? matches.map(function (match) {
            var i = singleMatch.exec(match);
            return i && [i[1], i[2]];
        })
        : [];
    return links.flat();
};
exports.matchMarkdownLinks = matchMarkdownLinks;
