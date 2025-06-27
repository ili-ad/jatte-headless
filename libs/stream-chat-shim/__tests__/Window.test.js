"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Window_1 = require("../src/Window");
test('renders children', function () {
    var getByTestId = (0, react_2.render)(<Window_1.Window>
      <span data-testid="child"/>
    </Window_1.Window>).getByTestId;
    expect(getByTestId('child')).toBeTruthy();
});
