"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInput = void 0;
var react_1 = require("react");
var useTranslationContext = function (_componentName) { return ({
    t: function (key) { return key; },
}); };
var SearchInput = function (props) {
    var disabled = props.disabled, inputRef = props.inputRef, onSearch = props.onSearch, placeholder = props.placeholder, query = props.query;
    var t = useTranslationContext('SearchInput').t;
    return (<input className='str-chat__channel-search-input' data-testid='search-input' disabled={disabled} onChange={onSearch} placeholder={placeholder !== null && placeholder !== void 0 ? placeholder : t('Search')} ref={inputRef} type='text' value={query}/>);
};
exports.SearchInput = SearchInput;
