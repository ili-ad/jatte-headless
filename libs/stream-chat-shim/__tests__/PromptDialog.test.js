"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PromptDialog_1 = require("../src/components/Dialog/PromptDialog");
test('renders without crashing', function () {
    (0, react_2.render)(<PromptDialog_1.PromptDialog prompt="confirm?" actions={[]}/>);
});
