"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var WaveProgressBar_1 = require("../src/components/Attachment/components/WaveProgressBar");
it('renders without crashing', function () {
    (0, react_2.render)(<WaveProgressBar_1.WaveProgressBar seek={function () { }} waveformData={[]}/>);
});
