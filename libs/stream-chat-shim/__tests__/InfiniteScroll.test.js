"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var InfiniteScroll_1 = require("../src/InfiniteScroll");
test('renders placeholder wrapper', function () {
    var getByTestId = (0, react_2.render)(<InfiniteScroll_1.InfiniteScroll loadNextPage={function () { }}>
      <div>child</div>
    </InfiniteScroll_1.InfiniteScroll>).getByTestId;
    expect(getByTestId('infinite-scroll-placeholder')).toBeTruthy();
});
