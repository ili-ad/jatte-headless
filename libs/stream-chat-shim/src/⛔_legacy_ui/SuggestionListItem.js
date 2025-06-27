"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionListItem = void 0;
// libs/stream-chat-shim/src/SuggestionListItem.tsx
var react_1 = require("react");
/**
 * Placeholder implementation of SuggestionListItem.
 */
exports.SuggestionListItem = react_1.default.forwardRef(function SuggestionListItem(_a, ref) {
    var className = _a.className, Component = _a.component, focused = _a.focused, item = _a.item, onMouseEnter = _a.onMouseEnter;
    return (<li className={className} onMouseEnter={onMouseEnter}>
        <button ref={ref} type="button">
          <Component entity={item} focused={focused}/>
        </button>
      </li>);
});
