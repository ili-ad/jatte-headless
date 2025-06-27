"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRenderer = exports.EmptyPlaceholder = exports.Header = exports.Item = exports.makeItemsRenderedHandler = void 0;
exports.calculateItemIndex = calculateItemIndex;
exports.calculateFirstItemIndex = calculateFirstItemIndex;
var react_1 = require("react");
var PREPEND_OFFSET = Math.pow(10, 7);
/**
 * Calculates the index of a message in the original message list based on
 * the position in the virtualized list.
 */
function calculateItemIndex(virtuosoIndex, numItemsPrepended) {
    return virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
}
/**
 * Calculates the first item index for the virtual list given how many items
 * were prepended before the initial page.
 */
function calculateFirstItemIndex(numItemsPrepended) {
    return PREPEND_OFFSET - numItemsPrepended;
}
/**
 * Creates a no-op handler for the `itemsRendered` callback.
 */
var makeItemsRenderedHandler = function (_renderedItemsActions, _processedMessages) {
    return function (_items) {
        // noop placeholder
    };
};
exports.makeItemsRenderedHandler = makeItemsRenderedHandler;
/**
 * Minimal item wrapper used in the virtualized message list.
 */
var Item = function (props) {
    return <div {...props}/>;
};
exports.Item = Item;
/**
 * Renders the header for the virtualized message list.
 */
var Header = function (_a) {
    var context = _a.context;
    return <>{context === null || context === void 0 ? void 0 : context.head}</>;
};
exports.Header = Header;
/**
 * Placeholder component shown when there are no messages.
 */
var EmptyPlaceholder = function (_a) {
    var _b;
    var context = _a.context;
    if ((_b = context === null || context === void 0 ? void 0 : context.processedMessages) === null || _b === void 0 ? void 0 : _b.length)
        return null;
    return <div data-testid="virtualized-message-list-empty"/>;
};
exports.EmptyPlaceholder = EmptyPlaceholder;
/**
 * Default renderer for a message in the virtualized list.
 */
var messageRenderer = function (_index, _data, _context) { return <div data-testid="virtualized-message">VirtualizedMessage</div>; };
exports.messageRenderer = messageRenderer;
