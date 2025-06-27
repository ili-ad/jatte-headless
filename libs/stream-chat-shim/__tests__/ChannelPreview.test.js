"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChannelPreview_1 = require("../src/ChannelPreview");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<ChannelPreview_1.ChannelPreview channel={{}}/>).getByTestId;
    expect(getByTestId('channel-preview-placeholder')).toBeTruthy();
});
