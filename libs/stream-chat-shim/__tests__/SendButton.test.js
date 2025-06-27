"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var SendButton_1 = require("../src/components/MessageInput/SendButton");
test('renders without crashing', function () {
    (0, react_1.render)(<SendButton_1.SendButton sendMessage={function () { }}/>);
});
