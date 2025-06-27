"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SearchResultItem_1 = require("../src/SearchResultItem");
var SearchResultItem_2 = require("../src/SearchResultItem");
test('renders placeholder', function () {
    var channel = { id: '123', type: 'messaging' };
    expect(getByTestId('search-result-item-placeholder')).toBeTruthy();
    var getByTestId = (0, react_2.render)(<SearchResultItem_1.ChannelSearchResultItem item={channel}/>).getByTestId;
    var getByTestId = (0, react_2.render)(<SearchResultItem_2.SearchResultItem />).getByTestId;
    expect(getByTestId('search-result-channel')).toBeTruthy();
});
