"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadMoreButton = void 0;
var react_1 = require("react");
var Loading_1 = require("../Loading");
var deprecationWarning_1 = require("../../utils/deprecationWarning");
var context_1 = require("../../context");
var UnMemoizedLoadMoreButton = function (_a) {
    var children = _a.children, isLoading = _a.isLoading, onClick = _a.onClick, refreshing = _a.refreshing;
    var t = (0, context_1.useTranslationContext)('UnMemoizedLoadMoreButton').t;
    var childrenOrDefaultString = children !== null && children !== void 0 ? children : t('Load more');
    var loading = typeof isLoading !== 'undefined' ? isLoading : refreshing;
    (0, react_1.useEffect)(function () {
        (0, deprecationWarning_1.deprecationAndReplacementWarning)([[{ refreshing: refreshing }, { isLoading: isLoading }]], 'LoadMoreButton');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (<div className='str-chat__load-more-button'>
      <button aria-label={t('aria/Load More Channels')} className='str-chat__load-more-button__button str-chat__cta-button' data-testid='load-more-button' disabled={loading} onClick={onClick}>
        {loading ? <Loading_1.LoadingIndicator /> : childrenOrDefaultString}
      </button>
    </div>);
};
exports.LoadMoreButton = react_1.default.memo(UnMemoizedLoadMoreButton);
