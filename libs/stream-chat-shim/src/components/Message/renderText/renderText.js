"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.renderText = exports.markDownRenderers = exports.defaultAllowedTagNames = void 0;
var react_1 = require("react");
var react_markdown_1 = require("react-markdown");
var linkifyjs_1 = require("linkifyjs");
var lodash_uniqby_1 = require("lodash.uniqby");
var remark_gfm_1 = require("remark-gfm");
var componentRenderers_1 = require("./componentRenderers");
var regex_1 = require("./regex");
var rehypePlugins_1 = require("./rehypePlugins");
var remarkPlugins_1 = require("./remarkPlugins");
var UtilityComponents_1 = require("../../UtilityComponents");
exports.defaultAllowedTagNames = [
    'html',
    'text',
    'br',
    'p',
    'em',
    'strong',
    'a',
    'ol',
    'ul',
    'li',
    'code',
    'pre',
    'blockquote',
    'del',
    'table',
    'thead',
    'tbody',
    'th',
    'tr',
    'td',
    'tfoot',
    // custom types (tagNames)
    'emoji',
    'mention',
];
function formatUrlForDisplay(url) {
    try {
        return decodeURIComponent(url).replace(regex_1.detectHttp, '');
    }
    catch (e) {
        return url;
    }
}
function encodeDecode(url) {
    try {
        return encodeURI(decodeURIComponent(url));
    }
    catch (error) {
        return url;
    }
}
var urlTransform = function (uri) {
    return uri.startsWith('app://') ? uri : (0, react_markdown_1.defaultUrlTransform)(uri);
};
var getPluginsForward = function (plugins) {
    return plugins;
};
exports.markDownRenderers = {
    a: componentRenderers_1.Anchor,
    emoji: componentRenderers_1.Emoji,
    mention: componentRenderers_1.Mention,
};
var renderText = function (text, mentionedUsers, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.allowedTagNames, allowedTagNames = _c === void 0 ? exports.defaultAllowedTagNames : _c, customMarkDownRenderers = _b.customMarkDownRenderers, _d = _b.getRehypePlugins, getRehypePlugins = _d === void 0 ? getPluginsForward : _d, _e = _b.getRemarkPlugins, getRemarkPlugins = _e === void 0 ? getPluginsForward : _e;
    // take the @ mentions and turn them into markdown?
    // translate links
    if (!text)
        return null;
    if (text.trim().length === 1)
        return <>{text}</>;
    var newText = text;
    var markdownLinks = (0, regex_1.matchMarkdownLinks)(newText);
    var codeBlocks = (0, regex_1.messageCodeBlocks)(newText);
    // extract all valid links/emails within text and replace it with proper markup
    (0, lodash_uniqby_1.default)(__spreadArray(__spreadArray([], (0, linkifyjs_1.find)(newText, 'email'), true), (0, linkifyjs_1.find)(newText, 'url'), true), 'value').forEach(function (_a) {
        var href = _a.href, type = _a.type, value = _a.value;
        var linkIsInBlock = codeBlocks.some(function (block) { return block === null || block === void 0 ? void 0 : block.includes(value); });
        // check if message is already  markdown
        var noParsingNeeded = markdownLinks &&
            markdownLinks.filter(function (text) {
                var strippedHref = href === null || href === void 0 ? void 0 : href.replace(regex_1.detectHttp, '');
                var strippedText = text === null || text === void 0 ? void 0 : text.replace(regex_1.detectHttp, '');
                if (!strippedHref || !strippedText)
                    return false;
                return (strippedHref.includes(strippedText) || strippedText.includes(strippedHref));
            });
        if (noParsingNeeded.length > 0 || linkIsInBlock)
            return;
        try {
            // special case for mentions:
            // it could happen that a user's name matches with an e-mail format pattern.
            // in that case, we check whether the found e-mail is actually a mention
            // by naively checking for an existence of @ sign in front of it.
            if (type === 'email' && mentionedUsers) {
                var emailMatchesWithName = mentionedUsers.some(function (u) { return u.name === value; });
                if (emailMatchesWithName) {
                    newText = newText.replace(new RegExp((0, regex_1.escapeRegExp)(value), 'g'), function (match, position) {
                        var isMention = newText.charAt(position - 1) === '@';
                        // in case of mention, we leave the match in its original form,
                        // and we let `mentionsMarkdownPlugin` to do its job
                        return isMention ? match : "[".concat(match, "](").concat(encodeDecode(href), ")");
                    });
                    return;
                }
            }
            var displayLink = type === 'email' ? value : formatUrlForDisplay(href);
            newText = newText.replace(new RegExp((0, regex_1.escapeRegExp)(value), 'g'), "[".concat(displayLink, "](").concat(encodeDecode(href), ")"));
        }
        catch (e) {
            void e;
        }
    });
    var remarkPlugins = [
        remarkPlugins_1.htmlToTextPlugin,
        remarkPlugins_1.keepLineBreaksPlugin,
        [remark_gfm_1.default, { singleTilde: false }],
    ];
    var rehypePlugins = [rehypePlugins_1.emojiMarkdownPlugin];
    if (mentionedUsers === null || mentionedUsers === void 0 ? void 0 : mentionedUsers.length) {
        rehypePlugins.push((0, rehypePlugins_1.mentionsMarkdownPlugin)(mentionedUsers));
    }
    return (<UtilityComponents_1.ErrorBoundary fallback={<>{text}</>}>
      <react_markdown_1.default allowedElements={allowedTagNames} components={__assign(__assign({}, exports.markDownRenderers), customMarkDownRenderers)} rehypePlugins={getRehypePlugins(rehypePlugins)} remarkPlugins={getRemarkPlugins(remarkPlugins)} skipHtml unwrapDisallowed urlTransform={urlTransform}>
        {newText}
      </react_markdown_1.default>
    </UtilityComponents_1.ErrorBoundary>);
};
exports.renderText = renderText;
