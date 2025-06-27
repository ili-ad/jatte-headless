"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SearchResults_1 = require("../src/SearchResults");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<SearchResults_1.SearchResults />).getByTestId;
    expect(getByTestId('search-results-placeholder')).toBeTruthy();
});
