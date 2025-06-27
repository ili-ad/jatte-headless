"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageEditedTimestamp_1 = require("../src/components/Message/MessageEditedTimestamp");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageEditedTimestamp_1.MessageEditedTimestamp open={true} message={{ message_text_updated_at: new Date() }}/>);
});
