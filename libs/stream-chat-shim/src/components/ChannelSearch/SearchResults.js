"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchResults = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var SearchIcon = function () { return null; }; // temporary shim
var ChannelPreview = function () { return null; }; // temporary shim
var isChannel = function (_) { return false; }; // temporary shim
var Avatar = function (props) { return <div {...props}/>; }; // temporary shim
var useTranslationContext = function (_) { return ({ t: function (key) { return key; } }); };
var DefaultSearchEmpty = function () {
    var t = useTranslationContext('SearchResults').t;
    return (<div aria-live='polite' className='str-chat__channel-search-container-empty'>
      <SearchIcon />
      {t('No results found')}
    </div>);
};
var DefaultSearchResultsHeader = function (_a) {
    var results = _a.results;
    var t = useTranslationContext('SearchResultsHeader').t;
    return (<div className='str-chat__channel-search-results-header' data-testid='channel-search-results-header'>
      {t('searchResultsCount', {
            count: results.length,
        })}
    </div>);
};
var DefaultSearchResultsList = function (props) {
    var focusedUser = props.focusedUser, results = props.results, SearchResultItem = props.SearchResultItem, selectResult = props.selectResult;
    return (<>
      {results.map(function (result, index) { return (<SearchResultItem focusedUser={focusedUser} index={index} key={index} result={result} selectResult={selectResult}/>); })}
    </>);
};
var DefaultSearchResultItem = function (props) {
    var focusedUser = props.focusedUser, index = props.index, result = props.result, selectResult = props.selectResult;
    var focused = focusedUser === index;
    var className = (0, clsx_1.default)('str-chat__channel-search-result', focused && 'str-chat__channel-search-result--focused');
    if (isChannel(result)) {
        var channel_1 = result;
        return (<ChannelPreview channel={channel_1} className={className} onSelect={function () { return selectResult(channel_1); }}/>);
    }
    else {
        return (<button aria-label={"Select User Channel: ".concat(result.name || '')} className={className} data-testid='channel-search-result-user' onClick={function () { return selectResult(result); }} role='option'>
        <Avatar className='str-chat__avatar--channel-preview' image={result.image} name={result.name || result.id} user={result}/>
        <div className='str-chat__channel-search-result--display-name'>
          {result.name || result.id}
        </div>
      </button>);
    }
};
var ResultsContainer = function (_a) {
    var children = _a.children, popupResults = _a.popupResults;
    var t = useTranslationContext('ResultsContainer').t;
    return (<div aria-label={t('aria/Channel search results')} className={(0, clsx_1.default)("str-chat__channel-search-result-list", popupResults ? 'popup' : 'inline')}>
      {children}
    </div>);
};
var SearchResults = function (props) {
    var popupResults = props.popupResults, results = props.results, _a = props.SearchEmpty, SearchEmpty = _a === void 0 ? DefaultSearchEmpty : _a, searching = props.searching, SearchLoading = props.SearchLoading, _b = props.SearchResultItem, SearchResultItem = _b === void 0 ? DefaultSearchResultItem : _b, _c = props.SearchResultsHeader, SearchResultsHeader = _c === void 0 ? DefaultSearchResultsHeader : _c, _d = props.SearchResultsList, SearchResultsList = _d === void 0 ? DefaultSearchResultsList : _d, selectResult = props.selectResult;
    var t = useTranslationContext('SearchResults').t;
    var _e = (0, react_1.useState)(), focusedResult = _e[0], setFocusedResult = _e[1];
    var handleKeyDown = (0, react_1.useCallback)(function (event) {
        if (event.key === 'ArrowUp') {
            setFocusedResult(function (prevFocused) {
                if (prevFocused === undefined)
                    return 0;
                return prevFocused === 0 ? results.length - 1 : prevFocused - 1;
            });
        }
        if (event.key === 'ArrowDown') {
            setFocusedResult(function (prevFocused) {
                if (prevFocused === undefined)
                    return 0;
                return prevFocused === results.length - 1 ? 0 : prevFocused + 1;
            });
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            setFocusedResult(function (prevFocused) {
                if (typeof prevFocused !== 'undefined') {
                    selectResult(results[prevFocused]);
                    return undefined;
                }
                return prevFocused;
            });
        }
    }, [results, selectResult]);
    (0, react_1.useEffect)(function () {
        document.addEventListener('keydown', handleKeyDown, false);
        return function () { return document.removeEventListener('keydown', handleKeyDown); };
    }, [handleKeyDown]);
    if (searching) {
        return (<ResultsContainer popupResults={popupResults}>
        {SearchLoading ? (<SearchLoading />) : (<div className='str-chat__channel-search-container-searching' data-testid='search-in-progress-indicator'>
            {t('Searching...')}
          </div>)}
      </ResultsContainer>);
    }
    if (!results.length) {
        return (<ResultsContainer popupResults={popupResults}>
        <SearchEmpty />
      </ResultsContainer>);
    }
    return (<ResultsContainer popupResults={popupResults}>
      <SearchResultsHeader results={results}/>
      <SearchResultsList focusedUser={focusedResult} results={results} SearchResultItem={SearchResultItem} selectResult={selectResult}/>
    </ResultsContainer>);
};
exports.SearchResults = SearchResults;
