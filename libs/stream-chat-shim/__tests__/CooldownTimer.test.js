"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var CooldownTimer_1 = require("../src/components/MessageInput/CooldownTimer");
test('renders without crashing', function () {
    (0, react_2.render)(<CooldownTimer_1.CooldownTimer cooldownInterval={0} setCooldownRemaining={function () { }}/>);
});
