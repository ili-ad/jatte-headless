"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateSeparator = void 0;
var react_1 = require("react");
var TranslationContext_1 = require("../../context/TranslationContext");
var utils_1 = require("../../i18n/utils");
var UnMemoizedDateSeparator = function (props) {
    var calendar = props.calendar, messageCreatedAt = props.date, formatDate = props.formatDate, _a = props.position, position = _a === void 0 ? 'right' : _a, unread = props.unread, restTimestampFormatterOptions = __rest(props, ["calendar", "date", "formatDate", "position", "unread"]);
    var _b = (0, TranslationContext_1.useTranslationContext)('DateSeparator'), t = _b.t, tDateTimeParser = _b.tDateTimeParser;
    var formattedDate = (0, utils_1.getDateString)(__assign(__assign({ calendar: calendar }, restTimestampFormatterOptions), { formatDate: formatDate, messageCreatedAt: messageCreatedAt, t: t, tDateTimeParser: tDateTimeParser, timestampTranslationKey: 'timestamp/DateSeparator' }));
    return (<div className='str-chat__date-separator' data-testid='date-separator'>
      {(position === 'right' || position === 'center') && (<hr className='str-chat__date-separator-line'/>)}
      <div className='str-chat__date-separator-date'>
        {unread ? "".concat(t('New'), " - ").concat(formattedDate) : formattedDate}
      </div>
      {(position === 'left' || position === 'center') && (<hr className='str-chat__date-separator-line'/>)}
    </div>);
};
/**
 * A simple date separator between messages.
 */
exports.DateSeparator = react_1.default.memo(UnMemoizedDateSeparator);
