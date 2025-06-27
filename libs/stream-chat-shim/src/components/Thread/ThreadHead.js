"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadHead = void 0;
var react_1 = require("react");
var Message_1 = require("../Message");
var ThreadStart_1 = require("./ThreadStart");
var context_1 = require("../../context");
var ThreadHead = function (props) {
    var _a = (0, context_1.useComponentContext)('ThreadHead').ThreadStart, ThreadStart = _a === void 0 ? ThreadStart_1.ThreadStart : _a;
    return (<div className='str-chat__parent-message-li'>
      <Message_1.Message initialMessage threadList {...props}/>
      <ThreadStart />
    </div>);
};
exports.ThreadHead = ThreadHead;
