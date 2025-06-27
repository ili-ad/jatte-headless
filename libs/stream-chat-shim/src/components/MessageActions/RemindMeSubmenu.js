"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindMeSubmenu = exports.RemindMeActionButton = void 0;
var react_1 = require("react");
var context_1 = require("../../context");
var Dialog_1 = require("../Dialog");
var RemindMeActionButton = function (_a) {
    var className = _a.className, isMine = _a.isMine;
    var t = (0, context_1.useTranslationContext)().t;
    return (<Dialog_1.ButtonWithSubmenu aria-selected='false' className={className} placement={isMine ? 'left-start' : 'right-start'} Submenu={exports.RemindMeSubmenu}>
      {t('Remind Me')}
    </Dialog_1.ButtonWithSubmenu>);
};
exports.RemindMeActionButton = RemindMeActionButton;
var RemindMeSubmenu = function () {
    var t = (0, context_1.useTranslationContext)().t;
    var client = (0, context_1.useChatContext)().client;
    var message = (0, context_1.useMessageContext)().message;
    var scheduledOffsetsMs = [];
    /* TODO backend-wire-up: reminders.scheduledOffsetsMs */
    return (<div aria-label={t('aria/Remind Me Options')} className='str-chat__message-actions-box__submenu' role='listbox'>
      {scheduledOffsetsMs.map(function (offsetMs) { return (<button className='str-chat__message-actions-list-item-button' key={"reminder-offset-option--".concat(offsetMs)} onClick={function () {
                /* TODO backend-wire-up: reminders.upsertReminder */
            }}>
          {t('duration/Remind Me', { milliseconds: offsetMs })}
        </button>); })}
      {/* todo: potential improvement to add a custom option that would trigger rendering modal with custom date picker - we need date picker */}
    </div>);
};
exports.RemindMeSubmenu = RemindMeSubmenu;
