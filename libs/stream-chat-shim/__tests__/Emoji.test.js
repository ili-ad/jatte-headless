"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Emoji_1 = require("../src/components/Message/renderText/componentRenderers/Emoji");
test('renders without crashing', function () {
    (0, react_2.render)(<Emoji_1.Emoji>😀</Emoji_1.Emoji>);
});
