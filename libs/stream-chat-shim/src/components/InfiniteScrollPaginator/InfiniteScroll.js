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
exports.InfiniteScroll = void 0;
var react_1 = require("react");
var deprecationWarning_1 = require("../../utils/deprecationWarning");
var limits_1 = require("../../constants/limits");
/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 */
var mousewheelListener = function (event) {
    if (event instanceof WheelEvent && event.deltaY === 1) {
        event.preventDefault();
    }
};
/**
 * This component serves a single purpose - load more items on scroll inside the MessageList component
 * It is not a general purpose infinite scroll controller, because:
 * 1. It is re-rendered whenever queryInProgress, hasNext, hasPrev changes. This can lead to scrollListener to have stale data.
 * 2. It pretends to invoke scrollListener on resize event even though this event is emitted only on window resize. It should
 * rather use ResizeObserver. But then again, it ResizeObserver would invoke a stale version of scrollListener.
 *
 * In general, the infinite scroll controller should not aim for checking the loading state and whether there is more data to load.
 * That should be controlled by the loading function.
 */
var InfiniteScroll = function (props) {
    var children = props.children, _a = props.element, Component = _a === void 0 ? 'div' : _a, hasMore = props.hasMore, hasMoreNewer = props.hasMoreNewer, hasNextPage = props.hasNextPage, hasPreviousPage = props.hasPreviousPage, head = props.head, _b = props.initialLoad, initialLoad = _b === void 0 ? true : _b, isLoading = props.isLoading, listenToScroll = props.listenToScroll, loader = props.loader, loadMore = props.loadMore, loadMoreNewer = props.loadMoreNewer, loadNextPage = props.loadNextPage, loadPreviousPage = props.loadPreviousPage, _c = props.threshold, threshold = _c === void 0 ? limits_1.DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD : _c, _d = props.useCapture, useCapture = _d === void 0 ? false : _d, elementProps = __rest(props, ["children", "element", "hasMore", "hasMoreNewer", "hasNextPage", "hasPreviousPage", "head", "initialLoad", "isLoading", "listenToScroll", "loader", "loadMore", "loadMoreNewer", "loadNextPage", "loadPreviousPage", "threshold", "useCapture"]);
    var loadNextPageFn = loadNextPage || loadMoreNewer;
    var loadPreviousPageFn = loadPreviousPage || loadMore;
    var hasNextPageFlag = hasNextPage || hasMoreNewer;
    var hasPreviousPageFlag = hasPreviousPage || hasMore;
    var _e = (0, react_1.useState)(null), scrollComponent = _e[0], setScrollComponent = _e[1];
    var previousOffset = (0, react_1.useRef)(undefined);
    var previousReverseOffset = (0, react_1.useRef)(undefined);
    var scrollListenerRef = (0, react_1.useRef)(undefined);
    scrollListenerRef.current = function () {
        var element = scrollComponent;
        if (!element || element.offsetParent === null) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        var parentElement = element.parentElement;
        var offset = element.scrollHeight - parentElement.scrollTop - parentElement.clientHeight;
        var reverseOffset = parentElement.scrollTop;
        if (listenToScroll) {
            listenToScroll(offset, reverseOffset, threshold);
        }
        if (isLoading)
            return;
        if (previousOffset.current === offset &&
            previousReverseOffset.current === reverseOffset)
            return;
        previousOffset.current = offset;
        previousReverseOffset.current = reverseOffset;
        // FIXME: this triggers loadMore call when a user types messages in thread and the scroll container expands
        if (reverseOffset < Number(threshold) &&
            typeof loadPreviousPageFn === 'function' &&
            hasPreviousPageFlag) {
            loadPreviousPageFn();
        }
        if (offset < Number(threshold) &&
            typeof loadNextPageFn === 'function' &&
            hasNextPageFlag) {
            loadNextPageFn();
        }
    };
    (0, react_1.useEffect)(function () {
        (0, deprecationWarning_1.deprecationAndReplacementWarning)([
            [{ hasMoreNewer: hasMoreNewer }, { hasNextPage: hasNextPage }],
            [{ loadMoreNewer: loadMoreNewer }, { loadNextPage: loadNextPage }],
            [{ hasMore: hasMore }, { hasPreviousPage: hasPreviousPage }],
            [{ loadMore: loadMore }, { loadPreviousPage: loadPreviousPage }],
        ], 'InfiniteScroll');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    (0, react_1.useEffect)(function () {
        var scrollElement = scrollComponent === null || scrollComponent === void 0 ? void 0 : scrollComponent.parentNode;
        if (!scrollElement)
            return;
        var scrollListener = function () { var _a; return (_a = scrollListenerRef.current) === null || _a === void 0 ? void 0 : _a.call(scrollListenerRef); };
        scrollElement.addEventListener('scroll', scrollListener, useCapture);
        scrollElement.addEventListener('resize', scrollListener, useCapture);
        scrollListener();
        return function () {
            scrollElement.removeEventListener('scroll', scrollListener, useCapture);
            scrollElement.removeEventListener('resize', scrollListener, useCapture);
        };
    }, [initialLoad, scrollComponent, useCapture]);
    (0, react_1.useEffect)(function () {
        var scrollElement = scrollComponent === null || scrollComponent === void 0 ? void 0 : scrollComponent.parentNode;
        if (!scrollElement)
            return;
        scrollElement.addEventListener('wheel', mousewheelListener, { passive: false });
        return function () {
            scrollElement.removeEventListener('wheel', mousewheelListener, useCapture);
        };
    }, [scrollComponent, useCapture]);
    return (<Component {...elementProps} ref={setScrollComponent}>
      {head}
      {loader}
      {children}
    </Component>);
};
exports.InfiniteScroll = InfiniteScroll;
