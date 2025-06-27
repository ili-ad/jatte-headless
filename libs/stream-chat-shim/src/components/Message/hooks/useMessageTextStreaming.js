"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageTextStreaming = void 0;
var react_1 = require("react");
var DEFAULT_LETTER_INTERVAL = 30;
var DEFAULT_RENDERING_LETTER_COUNT = 2;
/**
 * A hook that returns text in a streamed, typewriter fashion. The speed of streaming is
 * configurable.
 * @param {number} [streamingLetterIntervalMs=30] - The timeout between each typing animation in milliseconds.
 * @param {number} [renderingLetterCount=2] - The number of letters to be rendered each time we update.
 * @param {string} text - The text that we want to render in a typewriter fashion.
 * @returns {{ streamedMessageText: string }} - A substring of the text property, up until we've finished rendering the typewriter animation.
 */
var useMessageTextStreaming = function (_a) {
    var _b = _a.renderingLetterCount, renderingLetterCount = _b === void 0 ? DEFAULT_RENDERING_LETTER_COUNT : _b, _c = _a.streamingLetterIntervalMs, streamingLetterIntervalMs = _c === void 0 ? DEFAULT_LETTER_INTERVAL : _c, text = _a.text;
    var _d = (0, react_1.useState)(text), streamedMessageText = _d[0], setStreamedMessageText = _d[1];
    var textCursor = (0, react_1.useRef)(text.length);
    (0, react_1.useEffect)(function () {
        var textLength = text.length;
        var interval = setInterval(function () {
            if (!text || textCursor.current >= textLength) {
                clearInterval(interval);
            }
            var newCursorValue = textCursor.current + renderingLetterCount;
            var newText = text.substring(0, newCursorValue);
            textCursor.current += newText.length - textCursor.current;
            setStreamedMessageText(newText);
        }, streamingLetterIntervalMs);
        return function () {
            clearInterval(interval);
        };
    }, [streamingLetterIntervalMs, renderingLetterCount, text]);
    return { streamedMessageText: streamedMessageText };
};
exports.useMessageTextStreaming = useMessageTextStreaming;
