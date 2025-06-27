"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelPreviewActionButtons_1 = require("../src/components/ChannelPreview/ChannelPreviewActionButtons");
test('renders without crashing', function () {
    (0, react_2.render)(<ChannelPreviewActionButtons_1.ChannelPreviewActionButtons channel={{}}/>);
});
