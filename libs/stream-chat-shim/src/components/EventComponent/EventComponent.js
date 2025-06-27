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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventComponent = void 0;
var react_1 = require("react");
var Avatar_1 = require("../Avatar");
var TranslationContext_1 = require("../../context/TranslationContext");
var utils_1 = require("../../i18n/utils");
/**
 * Component to display system and channel event messages
 */
var UnMemoizedEventComponent = function (props) {
    var _a, _b, _c;
    var _d = props.Avatar, Avatar = _d === void 0 ? Avatar_1.Avatar : _d, calendar = props.calendar, calendarFormats = props.calendarFormats, format = props.format, message = props.message;
    var _e = (0, TranslationContext_1.useTranslationContext)('EventComponent'), t = _e.t, tDateTimeParser = _e.tDateTimeParser;
    var _f = message.created_at, created_at = _f === void 0 ? '' : _f, event = message.event, text = message.text, type = message.type;
    var getDateOptions = { messageCreatedAt: created_at.toString(), tDateTimeParser: tDateTimeParser };
    if (type === 'system')
        return (<div className='str-chat__message--system' data-testid='message-system'>
        <div className='str-chat__message--system__text'>
          <div className='str-chat__message--system__line'/>
          <p>{text}</p>
          <div className='str-chat__message--system__line'/>
        </div>
        <div className='str-chat__message--system__date'>
          <strong>
            {(0, utils_1.getDateString)(__assign(__assign({}, getDateOptions), { calendar: calendar, calendarFormats: calendarFormats, format: format, t: t, timestampTranslationKey: 'timestamp/SystemMessage' }))}
          </strong>
        </div>
      </div>);
    if ((event === null || event === void 0 ? void 0 : event.type) === 'member.removed' || (event === null || event === void 0 ? void 0 : event.type) === 'member.added') {
        var name_1 = ((_a = event.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = event.user) === null || _b === void 0 ? void 0 : _b.id);
        var sentence = "".concat(name_1, " ").concat(event.type === 'member.added' ? 'has joined the chat' : 'was removed from the chat');
        return (<div className='str-chat__event-component__channel-event'>
        <Avatar image={(_c = event.user) === null || _c === void 0 ? void 0 : _c.image} name={name_1} user={event.user}/>
        <div className='str-chat__event-component__channel-event__content'>
          <em className='str-chat__event-component__channel-event__sentence'>
            {sentence}
          </em>
          <div className='str-chat__event-component__channel-event__date'>
            {(0, utils_1.getDateString)(__assign(__assign({}, getDateOptions), { format: 'LT' }))}
          </div>
        </div>
      </div>);
    }
    return null;
};
exports.EventComponent = react_1.default.memo(UnMemoizedEventComponent);
