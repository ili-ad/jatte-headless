"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamEmoji = void 0;
var react_1 = require("react");
var SpriteImage_1 = require("./SpriteImage");
var StreamSpriteEmojiPositions = {
    angry: [1, 1],
    haha: [1, 0],
    like: [0, 0],
    love: [1, 2],
    sad: [0, 1],
    wow: [0, 2],
};
var STREAM_SPRITE_URL = 'https://getstream.imgix.net/images/emoji-sprite.png';
var StreamEmoji = function (_a) {
    var fallback = _a.fallback, type = _a.type;
    var position = StreamSpriteEmojiPositions[type];
    return (<SpriteImage_1.SpriteImage columns={2} fallback={fallback} position={position} rows={3} spriteUrl={STREAM_SPRITE_URL} style={{
            '--str-chat__sprite-image-height': 'var(--str-chat__stream-emoji-size, 18px)',
        }}/>);
};
exports.StreamEmoji = StreamEmoji;
