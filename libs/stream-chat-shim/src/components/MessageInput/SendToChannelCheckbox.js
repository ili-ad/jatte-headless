"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendToChannelCheckbox = void 0;
var react_1 = require("react");
var useMessageComposer = function () { return ({}); }; // temporary shim
var store_1 = require("../../store");
var context_1 = require("../../context");
var stateSelector = function (state) { return ({
    showReplyInChannel: state.showReplyInChannel,
}); };
var SendToChannelCheckbox = function () {
    var t = (0, context_1.useTranslationContext)().t;
    var messageComposer = useMessageComposer();
    var showReplyInChannel = (0, store_1.useStateStore)(messageComposer.state, stateSelector).showReplyInChannel;
    if (messageComposer.editedMessage || !messageComposer.threadId)
        return null;
    return (<div className='str-chat__send-to-channel-checkbox__container'>
      <div className='str-chat__send-to-channel-checkbox__field'>
        <input id='send-to-channel-checkbox' onClick={messageComposer.toggleShowReplyInChannel} type='checkbox' value={showReplyInChannel.toString()}/>
        <label htmlFor='send-to-channel-checkbox'>
          {Object.keys(messageComposer.channel.state.members).length === 2
            ? t('Also send as a direct message')
            : t('Also send in channel')}
        </label>
      </div>
    </div>);
};
exports.SendToChannelCheckbox = SendToChannelCheckbox;
