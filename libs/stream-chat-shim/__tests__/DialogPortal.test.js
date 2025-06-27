"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var DialogPortal_1 = require("../src/components/Dialog/DialogPortal");
var react_2 = require("react");
test('renders without crashing', function () {
    (0, react_1.render)(<>
      <DialogPortal_1.DialogPortalDestination />
      <DialogPortal_1.DialogPortalEntry dialogId="test"/>
    </>);
});
