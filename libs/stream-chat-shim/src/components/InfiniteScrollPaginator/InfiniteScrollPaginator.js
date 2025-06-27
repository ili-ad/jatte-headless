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
exports.InfiniteScrollPaginator = void 0;
var clsx_1 = require("clsx");
var lodash_debounce_1 = require("lodash.debounce");
var react_1 = require("react");
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
var InfiniteScrollPaginator = function (props) {
    var children = props.children, className = props.className, listenToScroll = props.listenToScroll, _a = props.loadNextDebounceMs, loadNextDebounceMs = _a === void 0 ? 500 : _a, loadNextOnScrollToBottom = props.loadNextOnScrollToBottom, loadNextOnScrollToTop = props.loadNextOnScrollToTop, _b = props.threshold, threshold = _b === void 0 ? limits_1.DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD : _b, _c = props.useCapture, useCapture = _c === void 0 ? false : _c, componentProps = __rest(props, ["children", "className", "listenToScroll", "loadNextDebounceMs", "loadNextOnScrollToBottom", "loadNextOnScrollToTop", "threshold", "useCapture"]);
    var rootRef = (0, react_1.useRef)(null);
    var childRef = (0, react_1.useRef)(null);
    var scrollListener = (0, react_1.useMemo)(function () {
        return (0, lodash_debounce_1.default)(function () {
            var root = rootRef.current;
            var child = childRef.current;
            if (!root || root.offsetParent === null || !child) {
                return;
            }
            var distanceFromBottom = child.scrollHeight - root.scrollTop - root.clientHeight;
            var distanceFromTop = root.scrollTop;
            if (listenToScroll) {
                listenToScroll(distanceFromBottom, distanceFromTop, threshold);
            }
            if (distanceFromTop < Number(threshold)) {
                loadNextOnScrollToTop === null || loadNextOnScrollToTop === void 0 ? void 0 : loadNextOnScrollToTop();
            }
            if (distanceFromBottom < Number(threshold)) {
                loadNextOnScrollToBottom === null || loadNextOnScrollToBottom === void 0 ? void 0 : loadNextOnScrollToBottom();
            }
        }, loadNextDebounceMs);
    }, [
        listenToScroll,
        loadNextDebounceMs,
        loadNextOnScrollToBottom,
        loadNextOnScrollToTop,
        threshold,
    ]);
    (0, react_1.useEffect)(function () {
        var scrollElement = rootRef.current;
        if (!scrollElement)
            return;
        scrollElement.addEventListener('scroll', scrollListener, useCapture);
        return function () {
            scrollElement.removeEventListener('scroll', scrollListener, useCapture);
        };
    }, [scrollListener, useCapture]);
    (0, react_1.useEffect)(function () {
        var root = rootRef.current;
        if (!root || typeof ResizeObserver === 'undefined' || !scrollListener)
            return;
        var observer = new ResizeObserver(scrollListener);
        observer.observe(root);
        return function () {
            observer.disconnect();
        };
    }, [scrollListener]);
    (0, react_1.useEffect)(function () {
        var root = rootRef.current;
        if (root) {
            root.addEventListener('wheel', mousewheelListener, { passive: false });
        }
        return function () {
            if (root) {
                root.removeEventListener('wheel', mousewheelListener, useCapture);
            }
        };
    }, [useCapture]);
    return (<div {...componentProps} className={(0, clsx_1.default)('str-chat__infinite-scroll-paginator', className)} ref={rootRef}>
      <div className='str-chat__infinite-scroll-paginator__content' ref={childRef}>
        {children}
      </div>
    </div>);
};
exports.InfiniteScrollPaginator = InfiniteScrollPaginator;
