"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageBouncePrompt_1 = require("../src/components/MessageBounce/MessageBouncePrompt");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageBouncePrompt_1.MessageBouncePrompt />);
});
