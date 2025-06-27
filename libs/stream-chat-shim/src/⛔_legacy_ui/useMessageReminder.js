"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageReminder = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useMessageReminder` hook.
 * Returns the reminder associated with a message once implemented.
 */
var useMessageReminder = function (_messageId) {
    (0, react_1.useEffect)(function () {
        // TODO: connect to ReminderManager when ported
    }, [_messageId]);
    return undefined;
};
exports.useMessageReminder = useMessageReminder;
