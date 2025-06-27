"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelPreviewMessenger_1 = require("../src/components/ChannelPreview/ChannelPreviewMessenger");
test('renders without crashing', function () {
    (0, react_2.render)(<ChannelPreviewMessenger_1.ChannelPreviewMessenger active={false} channel={{}} unread={0}/>);
});
