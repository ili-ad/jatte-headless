"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var DialogAnchor_1 = require("../src/Dialog/DialogAnchor");
test('renders without crashing', function () {
    (0, react_2.render)(<DialogAnchor_1.DialogAnchor id="dialog" open={true} placement="auto" referenceElement={null}>
      content
    </DialogAnchor_1.DialogAnchor>);
});
