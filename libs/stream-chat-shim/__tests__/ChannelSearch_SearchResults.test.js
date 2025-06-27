"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SearchResults_1 = require("../src/components/ChannelSearch/SearchResults");
test('renders without crashing', function () {
    (0, react_2.render)(<SearchResults_1.SearchResults results={[]} searching={false} selectResult={function () { return undefined; }}/>);
});
