"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionListItem = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var useMessageComposer = function () { return ({ textComposer: { handleSelect: function (_) { } } }); }; // temporary shim
exports.SuggestionListItem = react_1.default.forwardRef(function SuggestionListItem(_a, innerRef) {
    var className = _a.className, Component = _a.component, focused = _a.focused, item = _a.item, onMouseEnter = _a.onMouseEnter;
    var textComposer = useMessageComposer().textComposer;
    var containerRef = (0, react_1.useRef)(null);
    var handleSelect = (0, react_1.useCallback)(function () {
        textComposer.handleSelect(item);
    }, [item, textComposer]);
    (0, react_1.useLayoutEffect)(function () {
        var _a;
        if (!focused)
            return;
        (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    }, [focused, containerRef]);
    return (<li className={(0, clsx_1.default)('str-chat__suggestion-list-item', className, {
            'str-chat__suggestion-item--selected': focused,
        })} onMouseEnter={onMouseEnter} ref={containerRef}>
      <button onClick={handleSelect} onKeyDown={function (event) {
            if (event.key === 'Enter') {
                handleSelect();
            }
        }} ref={innerRef}>
        <Component entity={item} focused={focused}/>
      </button>
    </li>);
});
