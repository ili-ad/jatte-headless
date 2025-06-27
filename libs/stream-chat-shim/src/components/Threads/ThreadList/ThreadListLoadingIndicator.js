"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadListLoadingIndicator = void 0;
var react_1 = require("react");
var Loading_1 = require("../../Loading");
var useChatContext = function () { return ({ client: { threads: { state: {} } } }); };
var useComponentContext = function () { return ({ LoadingIndicator: Loading_1.LoadingIndicator }); };
var useStateStore = function (_store, selector) { return selector({ pagination: { isLoadingNext: false } }); };
var selector = function (nextValue) { return ({
    isLoadingNext: nextValue.pagination.isLoadingNext,
}); };
var ThreadListLoadingIndicator = function () {
    var _a = useComponentContext().LoadingIndicator, LoadingIndicator = _a === void 0 ? Loading_1.LoadingIndicator : _a;
    var client = useChatContext().client;
    var isLoadingNext = useStateStore(client.threads.state, selector).isLoadingNext;
    if (!isLoadingNext)
        return null;
    return (<div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>);
};
exports.ThreadListLoadingIndicator = ThreadListLoadingIndicator;
