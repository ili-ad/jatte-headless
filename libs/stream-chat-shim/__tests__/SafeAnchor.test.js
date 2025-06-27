"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SafeAnchor_1 = require("../src/components/SafeAnchor");
test('renders without crashing', function () {
    (0, react_2.render)(<SafeAnchor_1.SafeAnchor href='http://example.com'>Link</SafeAnchor_1.SafeAnchor>);
});
