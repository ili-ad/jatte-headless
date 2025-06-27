"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadMoreButton = LoadMoreButton;
var react_1 = require("react");
/** Placeholder implementation for Stream\'s LoadMoreButton component. */
function LoadMoreButton(_a) {
    var children = _a.children, isLoading = _a.isLoading, onClick = _a.onClick, refreshing = _a.refreshing;
    var loading = typeof isLoading !== 'undefined' ? isLoading : refreshing;
    return (<div className="str-chat__load-more-button">
      <button aria-label="Load more" className="str-chat__load-more-button__button str-chat__cta-button" data-testid="load-more-button" disabled={!!loading} onClick={onClick}>
        {loading ? 'Loading…' : children !== null && children !== void 0 ? children : 'Load more'}
      </button>
    </div>);
}
exports.default = LoadMoreButton;
