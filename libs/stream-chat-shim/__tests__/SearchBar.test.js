"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SearchBar_1 = require("../src/components/ChannelSearch/SearchBar");
test('renders search bar', function () {
    var props = {
        activateSearch: jest.fn(),
        exitSearch: jest.fn(),
        inputIsFocused: false,
        searchBarRef: { current: null },
        clearState: jest.fn(),
        inputRef: { current: null },
        onSearch: jest.fn(),
        query: '',
    };
    var getByTestId = (0, react_2.render)(<SearchBar_1.SearchBar {...props}/>).getByTestId;
    expect(getByTestId('search-bar')).toBeTruthy();
});
