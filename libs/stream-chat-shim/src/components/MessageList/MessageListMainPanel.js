"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageListMainPanel = exports.MESSAGE_LIST_MAIN_PANEL_CLASS = void 0;
var react_1 = require("react");
exports.MESSAGE_LIST_MAIN_PANEL_CLASS = 'str-chat__main-panel-inner str-chat__message-list-main-panel';
var MessageListMainPanel = function (_a) {
    var children = _a.children;
    return (<div className={exports.MESSAGE_LIST_MAIN_PANEL_CLASS}>{children}</div>);
};
exports.MessageListMainPanel = MessageListMainPanel;
