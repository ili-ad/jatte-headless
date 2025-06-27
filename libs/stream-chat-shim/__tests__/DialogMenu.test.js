"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var DialogMenu_1 = require("../src/components/Dialog/DialogMenu");
test('renders without crashing', function () {
    (0, react_2.render)(<DialogMenu_1.DialogMenuButton>Test</DialogMenu_1.DialogMenuButton>);
});
