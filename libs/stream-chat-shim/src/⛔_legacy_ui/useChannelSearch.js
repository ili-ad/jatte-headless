"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelSearch = void 0;
var react_1 = require("react");
var useChannelSearch = function (params) {
    var _a = (0, react_1.useState)(false), inputIsFocused = _a[0], setInputIsFocused = _a[1];
    var _b = (0, react_1.useState)(''), query = _b[0], setQuery = _b[1];
    var _c = (0, react_1.useState)([]), results = _c[0], setResults = _c[1];
    var _d = (0, react_1.useState)(false), searching = _d[0], setSearching = _d[1];
    var inputRef = (0, react_1.useRef)(null);
    var searchBarRef = (0, react_1.useRef)(null);
    var clearState = (0, react_1.useCallback)(function () {
        setQuery('');
        setResults([]);
        setSearching(false);
    }, []);
    var activateSearch = (0, react_1.useCallback)(function () {
        setInputIsFocused(true);
    }, []);
    var exitSearch = (0, react_1.useCallback)(function () {
        var _a;
        setInputIsFocused(false);
        (_a = params.onSearchExit) === null || _a === void 0 ? void 0 : _a.call(params);
    }, [params]);
    var onSearch = (0, react_1.useCallback)(function (event) {
        var _a;
        event.preventDefault();
        if (params.disabled)
            return;
        setSearching(true);
        setQuery(event.target.value);
        (_a = params.onSearch) === null || _a === void 0 ? void 0 : _a.call(params, event);
    }, [params.disabled, params.onSearch]);
    var selectResult = (0, react_1.useCallback)(function (result) {
        var _a;
        (_a = params.onSelectResult) === null || _a === void 0 ? void 0 : _a.call(params, { setQuery: setQuery, setResults: setResults, setSearching: setSearching }, result);
        if (params.clearSearchOnClickOutside) {
            exitSearch();
        }
    }, [exitSearch, params]);
    return {
        activateSearch: activateSearch,
        clearState: clearState,
        exitSearch: exitSearch,
        inputIsFocused: inputIsFocused,
        inputRef: inputRef,
        onSearch: onSearch,
        query: query,
        results: results,
        searchBarRef: searchBarRef,
        searching: searching,
        selectResult: selectResult,
    };
};
exports.useChannelSearch = useChannelSearch;
