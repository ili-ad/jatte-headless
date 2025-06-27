"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Message_1 = require("../src/components/Message/Message");
test('renders without crashing', function () {
    (0, react_2.render)(<Message_1.Message message={{}}/>);
});
