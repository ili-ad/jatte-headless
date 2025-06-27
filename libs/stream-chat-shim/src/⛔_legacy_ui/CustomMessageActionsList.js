"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMessageActionsList = void 0;
var react_1 = require("react");
/** Placeholder implementation mimicking the Stream Chat component. */
var CustomMessageActionsList = function (props) {
    var customMessageActions = props.customMessageActions, message = props.message;
    if (!customMessageActions)
        return null;
    var customActionsArray = Object.keys(customMessageActions);
    return (<>
      {customActionsArray.map(function (customAction) {
            var customHandler = customMessageActions[customAction];
            return (<button aria-selected="false" className="str-chat__message-actions-list-item str-chat__message-actions-list-item-button" key={customAction} onClick={function (event) { return customHandler(message, event); }} role="option">
            {customAction}
          </button>);
        })}
    </>);
};
exports.CustomMessageActionsList = CustomMessageActionsList;
exports.default = exports.CustomMessageActionsList;
