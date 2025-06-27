"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderNotification = void 0;
var react_1 = require("react");
var context_1 = require("../../context");
var store_1 = require("../../store");
var reminderStateSelector = function (state) { return ({
    timeLeftMs: state.timeLeftMs,
}); };
var ReminderNotification = function (_a) {
    var _b;
    var reminder = _a.reminder;
    var t = (0, context_1.useTranslationContext)().t;
    var timeLeftMs = ((_b = (0, store_1.useStateStore)(reminder === null || reminder === void 0 ? void 0 : reminder.state, reminderStateSelector)) !== null && _b !== void 0 ? _b : {}).timeLeftMs;
    var stopRefreshBoundaryMs = reminder === null || reminder === void 0 ? void 0 : reminder.timer.stopRefreshBoundaryMs;
    var stopRefreshTimeStamp = (reminder === null || reminder === void 0 ? void 0 : reminder.remindAt) && stopRefreshBoundaryMs
        ? (reminder === null || reminder === void 0 ? void 0 : reminder.remindAt.getTime()) + stopRefreshBoundaryMs
        : undefined;
    var isBehindRefreshBoundary = !!stopRefreshTimeStamp && new Date().getTime() > stopRefreshTimeStamp;
    return (<p className="str-chat__message-reminder">
      <span>{t("Saved for later")}</span>
      {(reminder === null || reminder === void 0 ? void 0 : reminder.remindAt) && timeLeftMs !== null && (<>
          <span> | </span>
          <span>
            {isBehindRefreshBoundary
                ? t("Due since {{ dueSince }}", {
                    dueSince: t("timestamp/ReminderNotification", {
                        timestamp: reminder.remindAt,
                    }),
                })
                : t("Due {{ timeLeft }}", {
                    timeLeft: t("duration/Message reminder", {
                        milliseconds: timeLeftMs,
                    }),
                })}
          </span>
        </>)}
    </p>);
};
exports.ReminderNotification = ReminderNotification;
