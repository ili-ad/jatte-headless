"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var StreamEmoji_1 = require("../src/components/Reactions/StreamEmoji");
test('renders without crashing', function () {
    (0, react_2.render)(<StreamEmoji_1.StreamEmoji fallback='😀' type='like'/>);
});
