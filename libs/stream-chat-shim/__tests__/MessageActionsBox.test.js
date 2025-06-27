"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var MessageActionsBox_1 = require("../src/components/MessageActions/MessageActionsBox");
test('renders without crashing', function () {
    (0, react_2.render)(<MessageActionsBox_1.MessageActionsBox getMessageActions={function () { return []; }} handleDelete={function () { }} handleEdit={function () { }} handleFlag={function () { }} handleMarkUnread={function () { }} handleMute={function () { }} handlePin={function () { }} isUserMuted={function () { return false; }} mine={false} open={false}/>);
});
