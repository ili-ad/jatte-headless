"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var InfiniteScrollPaginator_1 = require("../src/components/InfiniteScrollPaginator/InfiniteScrollPaginator");
test('renders without crashing', function () {
    (0, react_2.render)(<InfiniteScrollPaginator_1.InfiniteScrollPaginator />);
});
