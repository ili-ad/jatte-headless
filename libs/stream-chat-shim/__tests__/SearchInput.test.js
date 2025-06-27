"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var SearchInput_1 = require("../src/components/ChannelSearch/SearchInput");
test('renders without crashing', function () {
    var inputRef = react_1.default.createRef();
    (0, react_2.render)(<SearchInput_1.SearchInput clearState={function () { }} inputRef={inputRef} onSearch={function () { }} query=""/>);
});
