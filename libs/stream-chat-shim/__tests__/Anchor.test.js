"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var Anchor_1 = require("../src/components/Message/renderText/componentRenderers/Anchor");
describe('Anchor', function () {
    test('renders without crashing', function () {
        (0, react_1.render)(<Anchor_1.Anchor href='http://example.com'>Link</Anchor_1.Anchor>);
    });
});
