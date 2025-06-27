"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageListScrollManager = useMessageListScrollManager;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useMessageListScrollManager` hook.
 * Currently does not adjust scroll position.
 */
function useMessageListScrollManager(_params) {
    var scrollTop = (0, react_1.useRef)(0);
    (0, react_1.useLayoutEffect)(function () {
        // TODO: implement scroll management logic
    }, [_params]);
    return function (scrollTopValue) {
        scrollTop.current = scrollTopValue;
    };
}
exports.default = useMessageListScrollManager;
