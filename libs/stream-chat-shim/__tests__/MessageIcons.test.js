"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var icons_1 = require("../src/components/Message/icons");
test('renders message icons without crashing', function () {
    (0, react_2.render)(<>
      <icons_1.ActionsIcon />
      <icons_1.ReactionIcon />
      <icons_1.ThreadIcon />
      <icons_1.PinIcon />
      <icons_1.PinIndicator message={{ id: '1' }} t={function (str) { return str; }}/>
      <icons_1.MessageDeliveredIcon />
      <icons_1.MessageErrorIcon />
    </>);
});
