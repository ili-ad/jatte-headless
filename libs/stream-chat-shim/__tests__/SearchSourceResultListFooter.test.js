"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SearchSourceResultListFooter_1 = require("../src/SearchSourceResultListFooter");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<SearchSourceResultListFooter_1.SearchSourceResultListFooter />).getByTestId;
    expect(getByTestId('search-source-result-list-footer-placeholder')).toBeTruthy();
});
