"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var VirtualizedMessageListComponents_1 = require("../src/components/MessageList/VirtualizedMessageListComponents");
test('renders without crashing', function () {
    (0, react_2.render)(<VirtualizedMessageListComponents_1.Item data-item-index={0}/>);
});
