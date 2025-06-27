"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var Audio_1 = require("../src/Attachment/Audio");
test('renders without crashing', function () {
    (0, react_2.render)(<Audio_1.Audio og={{ asset_url: 'a.mp3', file_size: 123, mime_type: 'audio/mpeg', title: 'a' }}/>);
});
