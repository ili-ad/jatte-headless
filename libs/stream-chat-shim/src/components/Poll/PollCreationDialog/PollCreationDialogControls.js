"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollCreationDialogControls = void 0;
var react_1 = require("react");
var useCanCreatePoll = function () { return true; }; // temporary shim
var useMessageComposer = function () { return ({
    pollComposer: { initState: function () { } },
    createPoll: function () { return Promise.resolve(); },
}); };
var context_1 = require("../../../context");
var PollCreationDialogControls = function (_a) {
    var close = _a.close;
    var t = (0, context_1.useTranslationContext)('PollCreationDialogControls').t;
    var handleSubmitMessage = (0, context_1.useMessageInputContext)().handleSubmit;
    var messageComposer = useMessageComposer();
    var canCreatePoll = useCanCreatePoll();
    return (<div className='str-chat__dialog__controls'>
      <button className='str-chat__dialog__controls-button str-chat__dialog__controls-button--cancel' onClick={function () {
            messageComposer.pollComposer.initState();
            close();
        }}>
        {t('Cancel')}
      </button>
      <button className='str-chat__dialog__controls-button str-chat__dialog__controls-button--submit' disabled={!canCreatePoll} onClick={function () {
            messageComposer
                .createPoll()
                .then(function () { return handleSubmitMessage(); })
                .then(close)
                .catch(console.error);
        }} type='submit'>
        {t('Create')}
      </button>
    </div>);
};
exports.PollCreationDialogControls = PollCreationDialogControls;
