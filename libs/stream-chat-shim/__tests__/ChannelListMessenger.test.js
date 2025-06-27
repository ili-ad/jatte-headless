"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelListMessenger_1 = require("../src/components/ChannelList/ChannelListMessenger");
test('renders without crashing', function () {
    (0, react_2.render)(<ChannelListMessenger_1.ChannelListMessenger error={null}/>);
});
