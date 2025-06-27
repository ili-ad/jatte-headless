"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mention = void 0;
var react_1 = require("react");
var Mention = function (_a) {
    var children = _a.children, mentionedUser = _a.node.mentionedUser;
    return (<span className='str-chat__message-mention' data-user-id={mentionedUser.id}>
    {children}
  </span>);
};
exports.Mention = Mention;
