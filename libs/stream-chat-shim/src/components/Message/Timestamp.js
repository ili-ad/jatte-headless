"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = Timestamp;
var react_1 = require("react");
var MessageContext_1 = require("../../context/MessageContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var utils_1 = require("../../i18n/utils");
function Timestamp(props) {
    var calendar = props.calendar, calendarFormats = props.calendarFormats, customClass = props.customClass, format = props.format, timestamp = props.timestamp;
    var formatDate = (0, MessageContext_1.useMessageContext)('MessageTimestamp').formatDate;
    var _a = (0, TranslationContext_1.useTranslationContext)('MessageTimestamp'), t = _a.t, tDateTimeParser = _a.tDateTimeParser;
    var normalizedTimestamp = timestamp && (0, utils_1.isDate)(timestamp) ? timestamp.toISOString() : timestamp;
    var when = (0, react_1.useMemo)(function () {
        return (0, utils_1.getDateString)({
            calendar: calendar,
            calendarFormats: calendarFormats,
            format: format,
            formatDate: formatDate,
            messageCreatedAt: normalizedTimestamp,
            t: t,
            tDateTimeParser: tDateTimeParser,
            timestampTranslationKey: 'timestamp/MessageTimestamp',
        });
    }, [
        calendar,
        calendarFormats,
        format,
        formatDate,
        normalizedTimestamp,
        t,
        tDateTimeParser,
    ]);
    if (!when) {
        return null;
    }
    return (<time className={customClass} dateTime={normalizedTimestamp} title={normalizedTimestamp}>
      {when}
    </time>);
}
