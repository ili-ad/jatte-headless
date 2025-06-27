"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var LoadingChannel_1 = require("../src/components/Channel/LoadingChannel");
test('renders without crashing', function () {
    (0, react_2.render)(<LoadingChannel_1.LoadingChannel />);
});
