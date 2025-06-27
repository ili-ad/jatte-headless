"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollToBottomButton = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's ScrollToBottomButton component.
 * It renders a simple button to jump to the latest message when the list is not
 * scrolled to the bottom.
 */
var ScrollToBottomButton = function (_a) {
    var isMessageListScrolledToBottom = _a.isMessageListScrolledToBottom, onClick = _a.onClick;
    if (isMessageListScrolledToBottom)
        return null;
    return (<div className="str-chat__jump-to-latest-message">
      <button aria-live="polite" className="str-chat__message-notification-scroll-to-latest str-chat__circle-fab" data-testid="message-notification" onClick={onClick}>
        Scroll to bottom
      </button>
    </div>);
};
exports.ScrollToBottomButton = ScrollToBottomButton;
exports.default = exports.ScrollToBottomButton;
