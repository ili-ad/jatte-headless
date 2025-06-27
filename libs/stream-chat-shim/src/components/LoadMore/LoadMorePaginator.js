"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadMorePaginator = exports.UnMemoizedLoadMorePaginator = void 0;
var react_1 = require("react");
var DefaultLoadMoreButton = (function () { return null; });
var deprecationAndReplacementWarning = function () { };
var UnMemoizedLoadMorePaginator = function (props) {
    var children = props.children, hasNextPage = props.hasNextPage, isLoading = props.isLoading, _a = props.LoadMoreButton, LoadMoreButton = _a === void 0 ? DefaultLoadMoreButton : _a, loadNextPage = props.loadNextPage, refreshing = props.refreshing, reverse = props.reverse;
    var loadingState = typeof isLoading !== 'undefined' ? isLoading : refreshing;
    (0, react_1.useEffect)(function () {
        deprecationAndReplacementWarning([[{ refreshing: refreshing }, { isLoading: isLoading }]], 'LoadMorePaginator');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (<>
      {!reverse && children}
      {hasNextPage && <LoadMoreButton isLoading={loadingState} onClick={loadNextPage}/>}
      {reverse && children}
    </>);
};
exports.UnMemoizedLoadMorePaginator = UnMemoizedLoadMorePaginator;
exports.LoadMorePaginator = react_1.default.memo(exports.UnMemoizedLoadMorePaginator);
