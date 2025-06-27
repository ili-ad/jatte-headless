"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentActions = void 0;
var react_1 = require("react");
var context_1 = require("../../context");
var UnMemoizedAttachmentActions = function (props) {
    var actionHandler = props.actionHandler, actions = props.actions, id = props.id, text = props.text;
    var t = (0, context_1.useTranslationContext)('UnMemoizedAttachmentActions').t;
    var handleActionClick = function (event, name, value) { return actionHandler === null || actionHandler === void 0 ? void 0 : actionHandler(name, value, event); };
    return (<div className='str-chat__message-attachment-actions'>
      <div className='str-chat__message-attachment-actions-form'>
        <span>{text}</span>
        {actions.map(function (action) { return (<button className={"str-chat__message-attachment-actions-button str-chat__message-attachment-actions-button--".concat(action.style)} data-testid={"".concat(action.name)} data-value={action.value} key={"".concat(id, "-").concat(action.value)} onClick={function (event) { return handleActionClick(event, action.name, action.value); }}>
            {action.text ? t(action.text) : null}
          </button>); })}
      </div>
    </div>);
};
/**
 * A component for rendering the actions you can take on an attachment.
 */
exports.AttachmentActions = react_1.default.memo(UnMemoizedAttachmentActions);
