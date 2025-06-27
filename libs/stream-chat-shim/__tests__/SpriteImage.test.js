"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SpriteImage_1 = require("../src/components/Reactions/SpriteImage");
test('renders without crashing', function () {
    (0, react_2.render)(<SpriteImage_1.SpriteImage columns={1} position={[0, 0]} rows={1} spriteUrl=''/>);
});
