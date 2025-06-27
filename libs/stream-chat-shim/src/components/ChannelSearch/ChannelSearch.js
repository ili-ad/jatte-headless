"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSearch = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var useChannelSearch_1 = require("./hooks/useChannelSearch");
var SearchBar_1 = require("./SearchBar");
var SearchInput_1 = require("./SearchInput");
var SearchResults_1 = require("./SearchResults");
var UnMemoizedChannelSearch = function (props) {
    var AppMenu = props.AppMenu, ClearInputIcon = props.ClearInputIcon, ExitSearchIcon = props.ExitSearchIcon, MenuIcon = props.MenuIcon, placeholder = props.placeholder, _a = props.popupResults, popupResults = _a === void 0 ? false : _a, _b = props.SearchBar, SearchBar = _b === void 0 ? SearchBar_1.SearchBar : _b, SearchEmpty = props.SearchEmpty, _c = props.SearchInput, SearchInput = _c === void 0 ? SearchInput_1.SearchInput : _c, SearchInputIcon = props.SearchInputIcon, SearchLoading = props.SearchLoading, SearchResultItem = props.SearchResultItem, SearchResultsHeader = props.SearchResultsHeader, SearchResultsList = props.SearchResultsList, channelSearchParams = __rest(props, ["AppMenu", "ClearInputIcon", "ExitSearchIcon", "MenuIcon", "placeholder", "popupResults", "SearchBar", "SearchEmpty", "SearchInput", "SearchInputIcon", "SearchLoading", "SearchResultItem", "SearchResultsHeader", "SearchResultsList"]);
    var _d = (0, useChannelSearch_1.useChannelSearch)(channelSearchParams), activateSearch = _d.activateSearch, clearState = _d.clearState, exitSearch = _d.exitSearch, inputIsFocused = _d.inputIsFocused, inputRef = _d.inputRef, onSearch = _d.onSearch, query = _d.query, results = _d.results, searchBarRef = _d.searchBarRef, searching = _d.searching, selectResult = _d.selectResult;
    return (<div className={(0, clsx_1.default)('str-chat__channel-search', popupResults
            ? 'str-chat__channel-search--popup'
            : 'str-chat__channel-search--inline', {
            'str-chat__channel-search--with-results': results.length > 0,
        })} data-testid='channel-search'>
      <SearchBar activateSearch={activateSearch} AppMenu={AppMenu} ClearInputIcon={ClearInputIcon} clearState={clearState} disabled={channelSearchParams.disabled} exitSearch={exitSearch} ExitSearchIcon={ExitSearchIcon} inputIsFocused={inputIsFocused} inputRef={inputRef} MenuIcon={MenuIcon} onSearch={onSearch} placeholder={placeholder} query={query} searchBarRef={searchBarRef} SearchInput={SearchInput} SearchInputIcon={SearchInputIcon}/>

      {query && (<SearchResults_1.SearchResults popupResults={popupResults} results={results} SearchEmpty={SearchEmpty} searching={searching} SearchLoading={SearchLoading} SearchResultItem={SearchResultItem} SearchResultsHeader={SearchResultsHeader} SearchResultsList={SearchResultsList} selectResult={selectResult}/>)}
    </div>);
};
/**
 * The ChannelSearch component makes a query users call and displays the results in a list.
 * Clicking on a list item will navigate you into a channel with the selected user. It can be used
 * on its own or added to the ChannelList component by setting the `showChannelSearch` prop to true.
 */
exports.ChannelSearch = react_1.default.memo(UnMemoizedChannelSearch);
