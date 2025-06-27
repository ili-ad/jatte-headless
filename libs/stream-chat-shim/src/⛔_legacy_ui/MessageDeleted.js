"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDeleted = void 0;
var react_1 = require("react");
/** Placeholder implementation of MessageDeleted component */
var MessageDeleted = function (_a) {
    var message = _a.message;
    return (<div className="str-chat__message str-chat__message--deleted" data-testid="message-deleted-component" key={message === null || message === void 0 ? void 0 : message.id}>
      <div className="str-chat__message--deleted-inner">This message was deleted...</div>
    </div>);
};
exports.MessageDeleted = MessageDeleted;
exports.default = exports.MessageDeleted;
