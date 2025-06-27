"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelHeader_1 = require("../src/components/ChannelHeader/ChannelHeader");
test('renders channel header', function () {
    var container = (0, react_2.render)(<ChannelHeader_1.ChannelHeader />).container;
    expect(container.querySelector('.str-chat__channel-header')).toBeTruthy();
});
