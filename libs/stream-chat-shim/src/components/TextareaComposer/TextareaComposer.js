"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.TextareaComposer = void 0;
var lodash_debounce_1 = require("lodash.debounce");
var clsx_1 = require("clsx");
var react_1 = require("react");
var react_2 = require("react");
var react_textarea_autosize_1 = require("react-textarea-autosize");
var useMessageComposer = function () { return ({ textComposer: {} }); }; // temporary shim
var context_1 = require("../../context");
var store_1 = require("../../store");
var SuggestionList_1 = require("./SuggestionList");
var textComposerStateSelector = function (state) { return ({
    selection: state.selection,
    suggestions: state.suggestions,
    text: state.text,
}); };
var searchSourceStateSelector = function (state) { return ({
    isLoadingItems: state.isLoading,
    items: state.items,
}); };
var configStateSelector = function (state) { return ({
    enabled: state.text.enabled,
}); };
/**
 * isComposing prevents double submissions in Korean and other languages.
 * starting point for a read:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
 * In the long term, the fix should happen by handling keypress, but changing this has unknown implications.
 */
var defaultShouldSubmit = function (event) {
    return event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;
};
var TextareaComposer = function (_a) {
    var _b;
    var _c, _d, _e;
    var className = _a.className, closeSuggestionsOnClickOutside = _a.closeSuggestionsOnClickOutside, containerClassName = _a.containerClassName, listClassName = _a.listClassName, maxRowsProp = _a.maxRows, minRowsProp = _a.minRows, onBlur = _a.onBlur, onChange = _a.onChange, onKeyDown = _a.onKeyDown, onScroll = _a.onScroll, onSelect = _a.onSelect, placeholderProp = _a.placeholder, shouldSubmitProp = _a.shouldSubmit, restTextareaProps = __rest(_a, ["className", "closeSuggestionsOnClickOutside", "containerClassName", "listClassName", "maxRows", "minRows", "onBlur", "onChange", "onKeyDown", "onScroll", "onSelect", "placeholder", "shouldSubmit"]);
    var t = (0, context_1.useTranslationContext)().t;
    var _f = (0, context_1.useComponentContext)().AutocompleteSuggestionList, AutocompleteSuggestionList = _f === void 0 ? SuggestionList_1.SuggestionList : _f;
    var _g = (0, context_1.useMessageInputContext)(), additionalTextareaProps = _g.additionalTextareaProps, cooldownRemaining = _g.cooldownRemaining, handleSubmit = _g.handleSubmit, maxRowsContext = _g.maxRows, minRowsContext = _g.minRows, onPaste = _g.onPaste, shouldSubmitContext = _g.shouldSubmit, textareaRef = _g.textareaRef;
    var maxRows = (_c = maxRowsProp !== null && maxRowsProp !== void 0 ? maxRowsProp : maxRowsContext) !== null && _c !== void 0 ? _c : 1;
    var minRows = minRowsProp !== null && minRowsProp !== void 0 ? minRowsProp : minRowsContext;
    var placeholder = placeholderProp !== null && placeholderProp !== void 0 ? placeholderProp : additionalTextareaProps === null || additionalTextareaProps === void 0 ? void 0 : additionalTextareaProps.placeholder;
    var shouldSubmit = (_d = shouldSubmitProp !== null && shouldSubmitProp !== void 0 ? shouldSubmitProp : shouldSubmitContext) !== null && _d !== void 0 ? _d : defaultShouldSubmit;
    var messageComposer = useMessageComposer();
    var textComposer = messageComposer.textComposer;
    var _h = (0, store_1.useStateStore)(textComposer.state, textComposerStateSelector), selection = _h.selection, suggestions = _h.suggestions, text = _h.text;
    var enabled = (0, store_1.useStateStore)(messageComposer.configState, configStateSelector).enabled;
    var isLoadingItems = ((_e = (0, store_1.useStateStore)(suggestions === null || suggestions === void 0 ? void 0 : suggestions.searchSource.state, searchSourceStateSelector)) !== null && _e !== void 0 ? _e : {}).isLoadingItems;
    var containerRef = (0, react_2.useRef)(null);
    var _j = (0, react_2.useState)(0), focusedItemIndex = _j[0], setFocusedItemIndex = _j[1];
    var _k = (0, react_2.useState)(false), isComposing = _k[0], setIsComposing = _k[1];
    var changeHandler = (0, react_2.useCallback)(function (e) {
        if (onChange) {
            onChange(e);
            return;
        }
        if (!textareaRef.current)
            return;
        textComposer.handleChange({
            selection: {
                end: textareaRef.current.selectionEnd,
                start: textareaRef.current.selectionStart,
            },
            text: e.target.value,
        });
    }, [onChange, textComposer, textareaRef]);
    var onCompositionEnd = (0, react_2.useCallback)(function () {
        setIsComposing(false);
    }, []);
    var onCompositionStart = (0, react_2.useCallback)(function () {
        setIsComposing(true);
    }, []);
    var keyDownHandler = (0, react_2.useCallback)(function (event) {
        var _a;
        if (onKeyDown) {
            onKeyDown(event);
            return;
        }
        if (textComposer.suggestions &&
            ((_a = textComposer.suggestions.searchSource.items) === null || _a === void 0 ? void 0 : _a.length)) {
            if (event.key === 'Escape')
                return textComposer.closeSuggestions();
            var loadedItems_1 = textComposer.suggestions.searchSource.items;
            if (event.key === 'Enter') {
                event.preventDefault();
                textComposer.handleSelect(loadedItems_1[focusedItemIndex]);
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setFocusedItemIndex(function (prev) {
                    var nextIndex = prev - 1;
                    if (suggestions === null || suggestions === void 0 ? void 0 : suggestions.searchSource.hasNext) {
                        nextIndex = prev;
                    }
                    else if (nextIndex < 0) {
                        nextIndex = loadedItems_1.length - 1;
                    }
                    return nextIndex;
                });
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setFocusedItemIndex(function (prev) {
                    var nextIndex = prev + 1;
                    if (suggestions === null || suggestions === void 0 ? void 0 : suggestions.searchSource.hasNext) {
                        nextIndex = prev;
                    }
                    else if (nextIndex >= loadedItems_1.length) {
                        nextIndex = 0;
                    }
                    return nextIndex;
                });
            }
        }
        else if (shouldSubmit(event) && textareaRef.current) {
            handleSubmit();
            textareaRef.current.selectionEnd = 0;
        }
    }, [
        focusedItemIndex,
        handleSubmit,
        onKeyDown,
        shouldSubmit,
        suggestions,
        textComposer,
        textareaRef,
    ]);
    var scrollHandler = (0, react_2.useCallback)(function (event) {
        if (onScroll) {
            onScroll(event);
        }
        else {
            textComposer.closeSuggestions();
        }
    }, [onScroll, textComposer]);
    var setSelectionDebounced = (0, react_1.useMemo)(function () {
        return (0, lodash_debounce_1.default)(function (e) {
            onSelect === null || onSelect === void 0 ? void 0 : onSelect(e);
            textComposer.setSelection({
                end: e.target.selectionEnd,
                start: e.target.selectionStart,
            });
        }, 100, { leading: false, trailing: true });
    }, [onSelect, textComposer]);
    (0, react_2.useEffect)(function () {
        // FIXME: find the real reason for cursor being set to the end on each change
        // This is a workaround to prevent the cursor from jumping
        // to the end of the textarea when the user is typing
        // at the position that is not at the end of the textarea value.
        if (textareaRef.current && !isComposing) {
            textareaRef.current.selectionStart = selection.start;
            textareaRef.current.selectionEnd = selection.end;
        }
    }, [text, textareaRef, selection.start, selection.end, isComposing]);
    (0, react_2.useEffect)(function () {
        if (textComposer.suggestions) {
            setFocusedItemIndex(0);
        }
    }, [textComposer.suggestions]);
    return (<div className={(0, clsx_1.default)('rta', 'str-chat__textarea str-chat__message-textarea-react-host', containerClassName, (_b = {},
            _b['rta--loading'] = isLoadingItems,
            _b))} ref={containerRef}>
      <react_textarea_autosize_1.default {...__assign(__assign({}, additionalTextareaProps), restTextareaProps)} aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder} className={(0, clsx_1.default)('rta__textarea', 'str-chat__textarea__textarea str-chat__message-textarea', className)} data-testid='message-input' disabled={!enabled || !!cooldownRemaining} maxRows={maxRows} minRows={minRows} onBlur={onBlur} onChange={changeHandler} onCompositionEnd={onCompositionEnd} onCompositionStart={onCompositionStart} onKeyDown={keyDownHandler} onPaste={onPaste} onScroll={scrollHandler} onSelect={setSelectionDebounced} placeholder={placeholder || t('Type your message')} ref={function (ref) {
            textareaRef.current = ref;
        }} value={text}/>
      {/* todo: X document the layout change for the accessibility purpose (tabIndex) */}
      {!isComposing && (<AutocompleteSuggestionList className={listClassName} closeOnClickOutside={closeSuggestionsOnClickOutside} focusedItemIndex={focusedItemIndex} setFocusedItemIndex={setFocusedItemIndex}/>)}
    </div>);
};
exports.TextareaComposer = TextareaComposer;
