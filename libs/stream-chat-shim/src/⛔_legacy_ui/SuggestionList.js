"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionList = exports.defaultComponents = void 0;
var react_1 = require("react");
exports.defaultComponents = {
    '/': function () { return null; },
    ':': function () { return null; },
    '@': function () { return null; },
};
/**
 * Placeholder SuggestionList component used while porting from stream-chat-react.
 * It simply renders a container div and does not implement suggestion logic yet.
 */
var SuggestionList = function (props) {
    var containerClassName = props.containerClassName;
    return <div className={containerClassName} data-testid="suggestion-list"/>;
};
exports.SuggestionList = SuggestionList;
exports.default = exports.SuggestionList;
