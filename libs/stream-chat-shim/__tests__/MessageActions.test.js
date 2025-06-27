"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageActions_1 = require("../src/components/MessageActions/MessageActions");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageActions_1.MessageActions message={{ id: '1' }} getMessageActions={function () { return []; }}/>);
});
