"use strict";
/* eslint-disable sort-keys */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultReactionOptions = void 0;
var react_1 = require("react");
var StreamEmoji = function (props) { return null; };
exports.defaultReactionOptions = [
    {
        type: 'haha',
        Component: function () { return <StreamEmoji fallback='😂' type='haha'/>; },
        name: 'Joy',
    },
    {
        type: 'like',
        Component: function () { return <StreamEmoji fallback='👍' type='like'/>; },
        name: 'Thumbs up',
    },
    {
        type: 'love',
        Component: function () { return <StreamEmoji fallback='❤️' type='love'/>; },
        name: 'Heart',
    },
    { type: 'sad', Component: function () { return <StreamEmoji fallback='😔' type='sad'/>; }, name: 'Sad' },
    {
        type: 'wow',
        Component: function () { return <StreamEmoji fallback='😲' type='wow'/>; },
        name: 'Astonished',
    },
];
