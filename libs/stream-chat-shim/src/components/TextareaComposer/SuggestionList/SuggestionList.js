"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionList = exports.defaultComponents = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var CommandItem_1 = require("./CommandItem");
var EmoticonItem_1 = require("./EmoticonItem");
var SuggestionListItem_1 = require("./SuggestionListItem");
var UserItem_1 = require("./UserItem");
var ComponentContext_1 = require("../../../context/ComponentContext");
var store_1 = require("../../../store");
var InfiniteScrollPaginator_1 = require("../../InfiniteScrollPaginator/InfiniteScrollPaginator");
var MessageInput_1 = require("../../MessageInput");
var textComposerStateSelector = function (state) { return ({
    suggestions: state.suggestions,
}); };
var searchSourceStateSelector = function (nextValue) {
    var _a;
    return ({
        items: (_a = nextValue.items) !== null && _a !== void 0 ? _a : [],
    });
};
exports.defaultComponents = {
    '/': function (props) { return (<CommandItem_1.CommandItem entity={props.entity}/>); },
    ':': function (props) { return (<EmoticonItem_1.EmoticonItem entity={props.entity}/>); },
    '@': function (props) { return (<UserItem_1.UserItem entity={props.entity}/>); },
};
var SuggestionList = function (_a) {
    var _b;
    var className = _a.className, _c = _a.closeOnClickOutside, closeOnClickOutside = _c === void 0 ? true : _c, containerClassName = _a.containerClassName, focusedItemIndex = _a.focusedItemIndex, setFocusedItemIndex = _a.setFocusedItemIndex, _d = _a.suggestionItemComponents, suggestionItemComponents = _d === void 0 ? exports.defaultComponents : _d;
    var _e = (0, ComponentContext_1.useComponentContext)().AutocompleteSuggestionItem, AutocompleteSuggestionItem = _e === void 0 ? SuggestionListItem_1.SuggestionListItem : _e;
    var messageComposer = (0, MessageInput_1.useMessageComposer)();
    var textComposer = messageComposer.textComposer;
    var suggestions = (0, store_1.useStateStore)(textComposer.state, textComposerStateSelector).suggestions;
    var items = ((_b = (0, store_1.useStateStore)(suggestions === null || suggestions === void 0 ? void 0 : suggestions.searchSource.state, searchSourceStateSelector)) !== null && _b !== void 0 ? _b : {}).items;
    var _f = (0, react_1.useState)(null), container = _f[0], setContainer = _f[1];
    var component = (suggestions === null || suggestions === void 0 ? void 0 : suggestions.trigger)
        ? suggestionItemComponents[suggestions === null || suggestions === void 0 ? void 0 : suggestions.trigger]
        : undefined;
    (0, react_1.useEffect)(function () {
        if (!closeOnClickOutside || !suggestions || !container)
            return;
        var handleClick = function (event) {
            if (container.contains(event.target))
                return;
            textComposer.closeSuggestions();
        };
        document.addEventListener('click', handleClick);
        return function () {
            document.removeEventListener('click', handleClick);
        };
    }, [closeOnClickOutside, suggestions, container, textComposer]);
    if (!suggestions || !(items === null || items === void 0 ? void 0 : items.length) || !component)
        return null;
    return (<div className={(0, clsx_1.default)('str-chat__suggestion-list-container', containerClassName)} ref={setContainer}>
      <InfiniteScrollPaginator_1.InfiniteScrollPaginator loadNextOnScrollToBottom={suggestions.searchSource.search} threshold={100}>
        <ul className={(0, clsx_1.default)('str-chat__suggestion-list str-chat__suggestion-list--react', className)}>
          {items.map(function (item, i) { return (<AutocompleteSuggestionItem component={component} focused={focusedItemIndex === i} item={item} key={item.id.toString()} onMouseEnter={function () { return setFocusedItemIndex === null || setFocusedItemIndex === void 0 ? void 0 : setFocusedItemIndex(i); }}/>); })}
        </ul>
      </InfiniteScrollPaginator_1.InfiniteScrollPaginator>
    </div>);
};
exports.SuggestionList = SuggestionList;
