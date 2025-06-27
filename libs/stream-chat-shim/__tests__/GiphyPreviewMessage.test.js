"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var GiphyPreviewMessage_1 = require("../src/components/MessageList/GiphyPreviewMessage");
test('renders giphy preview message', function () {
    var container = (0, react_2.render)(<GiphyPreviewMessage_1.GiphyPreviewMessage message={{}}/>).container;
    expect(container.querySelector('.giphy-preview-message')).toBeTruthy();
});
