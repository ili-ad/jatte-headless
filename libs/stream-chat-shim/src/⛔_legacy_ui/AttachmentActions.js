"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentActions = void 0;
var react_1 = require("react");
var AttachmentActions = function (_a) {
    var actions = _a.actions, id = _a.id, text = _a.text, actionHandler = _a.actionHandler;
    var handleActionClick = function (event, name, value) { return actionHandler === null || actionHandler === void 0 ? void 0 : actionHandler(name, value, event); };
    return (<div className="str-chat__message-attachment-actions">
      <div className="str-chat__message-attachment-actions-form">
        <span>{text}</span>
        {actions.map(function (action) {
            var _a;
            return (<button className={"str-chat__message-attachment-actions-button str-chat__message-attachment-actions-button--".concat(action.style)} data-testid={"".concat(action.name)} data-value={action.value} key={"".concat(id, "-").concat(action.value)} onClick={function (event) { return handleActionClick(event, action.name, action.value); }}>
            {(_a = action.text) !== null && _a !== void 0 ? _a : null}
          </button>);
        })}
      </div>
    </div>);
};
exports.AttachmentActions = AttachmentActions;
