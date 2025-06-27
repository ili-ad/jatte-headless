"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var MessageList_1 = require("../src/components/MessageList/hooks/MessageList");
test('hook initializes without crashing', function () {
    var div = document.createElement('div');
    var result = (0, react_1.renderHook)(function () {
        return (0, MessageList_1.useScrollLocationLogic)({
            hasMoreNewer: false,
            listElement: div,
            loadMoreScrollThreshold: 20,
            suppressAutoscroll: false,
            messages: [],
        });
    }).result;
    expect(result.current).toBeTruthy();
});
