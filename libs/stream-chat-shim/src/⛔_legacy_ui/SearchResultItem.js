'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSearchResultItems = exports.UserSearchResultItem = exports.MessageSearchResultItem = exports.ChannelSearchResultItem = exports.SearchResultItem = void 0;
var react_1 = require("react");
var SearchResultItem = function (_props) {
    return (<div data-testid="search-result-item-placeholder">SearchResultItem placeholder</div>);
};
exports.SearchResultItem = SearchResultItem;
exports.default = exports.SearchResultItem;
var ChannelSearchResultItem = function (_a) {
    var item = _a.item;
    return (<div data-testid="search-result-channel">Channel: {item.id}</div>);
};
exports.ChannelSearchResultItem = ChannelSearchResultItem;
var MessageSearchResultItem = function (_a) {
    var item = _a.item;
    return (<div data-testid="search-result-message">Message: {item.id}</div>);
};
exports.MessageSearchResultItem = MessageSearchResultItem;
var UserSearchResultItem = function (_a) {
    var _b;
    var item = _a.item;
    return (<div data-testid="search-result-user">{(_b = item.name) !== null && _b !== void 0 ? _b : item.id}</div>);
};
exports.UserSearchResultItem = UserSearchResultItem;
exports.DefaultSearchResultItems = {
    channels: exports.ChannelSearchResultItem,
    messages: exports.MessageSearchResultItem,
    users: exports.UserSearchResultItem,
};
