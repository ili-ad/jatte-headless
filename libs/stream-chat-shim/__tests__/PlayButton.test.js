"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PlayButton_1 = require("../src/components/Attachment/components/PlayButton");
test('renders play button', function () {
    var getByTestId = (0, react_2.render)(<PlayButton_1.PlayButton isPlaying={false} onClick={function () { }}/>).getByTestId;
    expect(getByTestId('play-audio')).toBeTruthy();
});
