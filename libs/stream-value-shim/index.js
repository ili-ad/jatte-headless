"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = exports.FixedSizeQueueCache = exports.MessageComposer = exports.LinkPreviewsManager = exports.replaceWordWithEntity = exports.insertItemWithTrigger = exports.getTriggerCharWithToken = exports.getTokenizedSuggestionDisplayName = exports.formatMessage = exports.isLocalAttachment = exports.isScrapedContent = exports.isVoiceRecordingAttachment = exports.isVideoAttachment = exports.isImageAttachment = exports.isFileAttachment = void 0;
// libs/stream-value-shim/index.ts
var isFileAttachment = function (_a) { return false; };
exports.isFileAttachment = isFileAttachment;
var isImageAttachment = function (_a) { return false; };
exports.isImageAttachment = isImageAttachment;
var isVideoAttachment = function (_a) { return false; };
exports.isVideoAttachment = isVideoAttachment;
var isVoiceRecordingAttachment = function (_a) { return false; };
exports.isVoiceRecordingAttachment = isVoiceRecordingAttachment;
var isScrapedContent = function (_a) { return false; };
exports.isScrapedContent = isScrapedContent;
var isLocalAttachment = function (_a) { return false; };
exports.isLocalAttachment = isLocalAttachment;
/* text-composer helpers */
var formatMessage = function () {
    var _a = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _a[_i] = arguments[_i];
    }
    return '';
};
exports.formatMessage = formatMessage;
var getTokenizedSuggestionDisplayName = function () { return ''; };
exports.getTokenizedSuggestionDisplayName = getTokenizedSuggestionDisplayName;
var getTriggerCharWithToken = function () { return ''; };
exports.getTriggerCharWithToken = getTriggerCharWithToken;
var insertItemWithTrigger = function (s) { return s; };
exports.insertItemWithTrigger = insertItemWithTrigger;
var replaceWordWithEntity = function (s) { return s; };
exports.replaceWordWithEntity = replaceWordWithEntity;
/* tiny empty classes */
var LinkPreviewsManager = /** @class */ (function () {
    function LinkPreviewsManager() {
    }
    return LinkPreviewsManager;
}());
exports.LinkPreviewsManager = LinkPreviewsManager;
var MessageComposer = /** @class */ (function () {
    function MessageComposer() {
    }
    return MessageComposer;
}());
exports.MessageComposer = MessageComposer;
var FixedSizeQueueCache = /** @class */ (function () {
    function FixedSizeQueueCache() {
    }
    return FixedSizeQueueCache;
}());
exports.FixedSizeQueueCache = FixedSizeQueueCache;
var SearchController = /** @class */ (function () {
    function SearchController() {
    }
    return SearchController;
}());
exports.SearchController = SearchController;
