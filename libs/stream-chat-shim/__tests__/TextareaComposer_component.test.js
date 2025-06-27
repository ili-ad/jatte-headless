"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var TextareaComposer_1 = require("../src/components/TextareaComposer/TextareaComposer");
test('renders without crashing', function () {
    (0, react_2.render)(<TextareaComposer_1.TextareaComposer />);
});
