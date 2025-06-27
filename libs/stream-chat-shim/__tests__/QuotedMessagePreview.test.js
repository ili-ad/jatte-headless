"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var QuotedMessagePreview_1 = require("../src/components/MessageInput/QuotedMessagePreview");
var quotedMessage = { text: 'Hi', user: { id: '1' } };
test('renders without crashing', function () {
    (0, react_2.render)(<QuotedMessagePreview_1.QuotedMessagePreview quotedMessage={quotedMessage}/>);
});
