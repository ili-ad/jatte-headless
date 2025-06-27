"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ConnectionStatus_1 = require("../src/ConnectionStatus");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<ConnectionStatus_1.ConnectionStatus />).getByTestId;
    expect(getByTestId('connection-status-placeholder')).toBeTruthy();
});
