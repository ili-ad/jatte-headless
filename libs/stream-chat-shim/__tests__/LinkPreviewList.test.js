"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var LinkPreviewList_1 = require("../src/components/MessageInput/LinkPreviewList");
test('renders without crashing', function () {
    (0, react_2.render)(<LinkPreviewList_1.LinkPreviewList />);
});
