"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PlaybackRateButton_1 = require("../src/components/Attachment/components/PlaybackRateButton");
test('renders playback rate button', function () {
    var getByTestId = (0, react_2.render)(<PlaybackRateButton_1.PlaybackRateButton>1x</PlaybackRateButton_1.PlaybackRateButton>).getByTestId;
    expect(getByTestId('playback-rate-button')).toBeTruthy();
});
