"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndPollDialog = void 0;
var PromptDialog_1 = require("../../Dialog/PromptDialog");
var react_1 = require("react");
var usePollContext = function () { return ({ poll: { close: function () { } } }); }; // temporary shim
var useTranslationContext = function (_componentName) { return ({ t: function (s) { return s; } }); }; // temporary shim
var EndPollDialog = function (_a) {
    var close = _a.close;
    var t = useTranslationContext('SuggestPollOptionForm').t;
    var poll = usePollContext().poll;
    return (<PromptDialog_1.PromptDialog actions={[
            {
                children: t('Cancel'),
                className: 'str-chat__dialog__controls-button--cancel',
                onClick: close,
            },
            {
                children: t('End'),
                className: 'str-chat__dialog__controls-button--submit str-chat__dialog__controls-button--end-poll',
                onClick: poll.close,
            },
        ]} className='str-chat__modal__end-vote' prompt={t('Nobody will be able to vote in this poll anymore.')} title={t('End vote')}/>);
};
exports.EndPollDialog = EndPollDialog;
