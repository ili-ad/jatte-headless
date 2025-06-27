"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelList_1 = require("../src/components/ChannelList/ChannelList");
test('renders without crashing', function () {
    (0, react_2.render)(<ChannelList_1.ChannelList />);
});
