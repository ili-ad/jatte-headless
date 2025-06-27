"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadListItem = exports.useThreadListItemContext = void 0;
var react_1 = require("react");
var ThreadListItemContext = (0, react_1.createContext)(undefined);
var useThreadListItemContext = function () { return (0, react_1.useContext)(ThreadListItemContext); };
exports.useThreadListItemContext = useThreadListItemContext;
/** Placeholder implementation of the ThreadListItem component. */
var ThreadListItem = function (_a) {
    var thread = _a.thread, threadListItemUIProps = _a.threadListItemUIProps;
    return (<ThreadListItemContext.Provider value={thread}>
      <div data-testid="thread-list-item-placeholder" {...threadListItemUIProps}>
        ThreadListItem
      </div>
    </ThreadListItemContext.Provider>);
};
exports.ThreadListItem = ThreadListItem;
exports.default = exports.ThreadListItem;
