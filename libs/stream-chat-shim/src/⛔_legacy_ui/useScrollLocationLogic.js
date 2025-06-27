"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollLocationLogic = void 0;
var react_1 = require("react");
// Minimal placeholder for useMessageListScrollManager until implemented
function useMessageListScrollManager(_params) {
    return function (_scrollTop) {
        /* no-op placeholder */
    };
}
/**
 * Lightweight replacement for Stream's `useScrollLocationLogic` hook.
 */
var useScrollLocationLogic = function (params) {
    var hasMoreNewer = params.hasMoreNewer, listElement = params.listElement, loadMoreScrollThreshold = params.loadMoreScrollThreshold, _a = params.messages, messages = _a === void 0 ? [] : _a, _b = params.scrolledUpThreshold, scrolledUpThreshold = _b === void 0 ? 200 : _b, suppressAutoscroll = params.suppressAutoscroll;
    var _c = (0, react_1.useState)(false), hasNewMessages = _c[0], setHasNewMessages = _c[1];
    var _d = (0, react_1.useState)(), wrapperRect = _d[0], setWrapperRect = _d[1];
    var _e = (0, react_1.useState)(true), isMessageListScrolledToBottom = _e[0], setIsMessageListScrolledToBottom = _e[1];
    var closeToBottom = (0, react_1.useRef)(false);
    var closeToTop = (0, react_1.useRef)(false);
    var scrollToBottom = (0, react_1.useCallback)(function () {
        if (!(listElement === null || listElement === void 0 ? void 0 : listElement.scrollTo) || hasMoreNewer || suppressAutoscroll) {
            return;
        }
        listElement.scrollTo({ top: listElement.scrollHeight });
        setHasNewMessages(false);
    }, [listElement, hasMoreNewer, suppressAutoscroll]);
    (0, react_1.useLayoutEffect)(function () {
        if (listElement) {
            setWrapperRect(listElement.getBoundingClientRect());
            scrollToBottom();
        }
    }, [listElement, hasMoreNewer, scrollToBottom]);
    var updateScrollTop = useMessageListScrollManager({
        loadMoreScrollThreshold: loadMoreScrollThreshold,
        messages: messages,
        onScrollBy: function (scrollBy) {
            listElement === null || listElement === void 0 ? void 0 : listElement.scrollBy({ top: scrollBy });
        },
        scrollContainerMeasures: function () { return ({
            offsetHeight: (listElement === null || listElement === void 0 ? void 0 : listElement.offsetHeight) || 0,
            scrollHeight: (listElement === null || listElement === void 0 ? void 0 : listElement.scrollHeight) || 0,
        }); },
        scrolledUpThreshold: scrolledUpThreshold,
        scrollToBottom: scrollToBottom,
        showNewMessages: function () { return setHasNewMessages(true); },
    });
    var onScroll = (0, react_1.useCallback)(function (event) {
        var element = event.target;
        var scrollTop = element.scrollTop;
        updateScrollTop(scrollTop);
        var offsetHeight = element.offsetHeight;
        var scrollHeight = element.scrollHeight;
        var prevCloseToBottom = closeToBottom.current;
        closeToBottom.current =
            scrollHeight - (scrollTop + offsetHeight) < scrolledUpThreshold;
        closeToTop.current = scrollTop < scrolledUpThreshold;
        if (closeToBottom.current) {
            setHasNewMessages(false);
        }
        if (prevCloseToBottom && !closeToBottom.current) {
            setIsMessageListScrolledToBottom(false);
        }
        else if (!prevCloseToBottom && closeToBottom.current) {
            setIsMessageListScrolledToBottom(true);
        }
    }, [updateScrollTop, scrolledUpThreshold]);
    return {
        hasNewMessages: hasNewMessages,
        isMessageListScrolledToBottom: isMessageListScrolledToBottom,
        onScroll: onScroll,
        scrollToBottom: scrollToBottom,
        wrapperRect: wrapperRect,
    };
};
exports.useScrollLocationLogic = useScrollLocationLogic;
exports.default = exports.useScrollLocationLogic;
