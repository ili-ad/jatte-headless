"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ButtonWithSubmenu_1 = require("../src/components/Dialog/ButtonWithSubmenu");
var Submenu = function () { return <div>submenu</div>; };
test('renders without crashing', function () {
    (0, react_2.render)(<ButtonWithSubmenu_1.ButtonWithSubmenu placement="bottom" Submenu={Submenu}>
      label
    </ButtonWithSubmenu_1.ButtonWithSubmenu>);
});
