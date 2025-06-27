"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadList = exports.useThreadList = void 0;
var react_1 = require("react");
/** Placeholder for Stream's `useThreadList` hook. */
var useThreadList = function () {
    // In the real implementation this hook manages thread list activation
    // and visibility based on the document state.
    (0, react_1.useEffect)(function () { }, []);
};
exports.useThreadList = useThreadList;
/** Minimal placeholder for Stream's `ThreadList` component. */
var ThreadList = function (_props) {
    return <div data-testid="thread-list-placeholder">ThreadList placeholder</div>;
};
exports.ThreadList = ThreadList;
exports.default = exports.ThreadList;
