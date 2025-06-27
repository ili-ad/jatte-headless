"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageInputFlat = void 0;
var react_1 = require("react");
var AttachmentSelector_1 = require("./AttachmentSelector");
var AttachmentPreviewList_1 = require("./AttachmentPreviewList");
var CooldownTimer_1 = require("./CooldownTimer");
var SendButton_1 = require("./SendButton");
var StopAIGenerationButton_1 = require("./StopAIGenerationButton");
var MediaRecorder_1 = require("../MediaRecorder");
var QuotedMessagePreview_1 = require("./QuotedMessagePreview");
var LinkPreviewList_1 = require("./LinkPreviewList");
var SendToChannelCheckbox_1 = require("./SendToChannelCheckbox");
var TextareaComposer_1 = require("../TextareaComposer");
var AIStateIndicator_1 = require("../AIStateIndicator");
var classes_1 = require("../MediaRecorder/classes");
var ChatContext_1 = require("../../context/ChatContext");
var MessageInputContext_1 = require("../../context/MessageInputContext");
var ComponentContext_1 = require("../../context/ComponentContext");
var useAttachmentManagerState_1 = require("./hooks/useAttachmentManagerState");
var context_1 = require("../../context");
var WithDragAndDropUpload_1 = require("./WithDragAndDropUpload");
var MessageInputFlat = function () {
    var message = (0, context_1.useMessageContext)().message;
    var _a = (0, MessageInputContext_1.useMessageInputContext)('MessageInputFlat'), asyncMessagesMultiSendEnabled = _a.asyncMessagesMultiSendEnabled, cooldownRemaining = _a.cooldownRemaining, handleSubmit = _a.handleSubmit, hideSendButton = _a.hideSendButton, recordingController = _a.recordingController, setCooldownRemaining = _a.setCooldownRemaining;
    var _b = (0, ComponentContext_1.useComponentContext)(), _c = _b.AttachmentPreviewList, AttachmentPreviewList = _c === void 0 ? AttachmentPreviewList_1.AttachmentPreviewList : _c, _d = _b.AttachmentSelector, AttachmentSelector = _d === void 0 ? message ? AttachmentSelector_1.SimpleAttachmentSelector : AttachmentSelector_1.AttachmentSelector : _d, _e = _b.AudioRecorder, AudioRecorder = _e === void 0 ? MediaRecorder_1.AudioRecorder : _e, _f = _b.CooldownTimer, CooldownTimer = _f === void 0 ? CooldownTimer_1.CooldownTimer : _f, EmojiPicker = _b.EmojiPicker, _g = _b.LinkPreviewList, LinkPreviewList = _g === void 0 ? LinkPreviewList_1.LinkPreviewList : _g, _h = _b.QuotedMessagePreview, QuotedMessagePreview = _h === void 0 ? QuotedMessagePreview_1.QuotedMessagePreview : _h, _j = _b.RecordingPermissionDeniedNotification, RecordingPermissionDeniedNotification = _j === void 0 ? MediaRecorder_1.RecordingPermissionDeniedNotification : _j, _k = _b.SendButton, SendButton = _k === void 0 ? SendButton_1.SendButton : _k, _l = _b.SendToChannelCheckbox, SendToChannelCheckbox = _l === void 0 ? SendToChannelCheckbox_1.SendToChannelCheckbox : _l, _m = _b.StartRecordingAudioButton, StartRecordingAudioButton = _m === void 0 ? MediaRecorder_1.StartRecordingAudioButton : _m, StopAIGenerationButtonOverride = _b.StopAIGenerationButton, _o = _b.TextareaComposer, TextareaComposer = _o === void 0 ? TextareaComposer_1.TextareaComposer : _o;
    var channel = (0, ChatContext_1.useChatContext)('MessageInputFlat').channel;
    var aiState = (0, AIStateIndicator_1.useAIState)(channel).aiState;
    var stopGenerating = (0, react_1.useCallback)(function () {
        /* TODO backend-wire-up: stopAIResponse */
    }, [channel]);
    var _p = (0, react_1.useState)(false), showRecordingPermissionDeniedNotification = _p[0], setShowRecordingPermissionDeniedNotification = _p[1];
    var closePermissionDeniedNotification = (0, react_1.useCallback)(function () {
        setShowRecordingPermissionDeniedNotification(false);
    }, []);
    var attachments = (0, useAttachmentManagerState_1.useAttachmentManagerState)().attachments;
    if (recordingController.recordingState)
        return <AudioRecorder />;
    var recordingEnabled = !!(recordingController.recorder && navigator.mediaDevices); // account for requirement on iOS as per this bug report: https://bugs.webkit.org/show_bug.cgi?id=252303
    var isRecording = !!recordingController.recordingState;
    /**
     * This bit here is needed to make sure that we can get rid of the default behaviour
     * if need be. Essentially, this allows us to pass StopAIGenerationButton={null} and
     * completely circumvent the default logic if it's not what we want. We need it as a
     * prop because there is no other trivial way to override the SendMessage button otherwise.
     */
    var StopAIGenerationButton = StopAIGenerationButtonOverride === undefined
        ? StopAIGenerationButton_1.StopAIGenerationButton
        : StopAIGenerationButtonOverride;
    var shouldDisplayStopAIGeneration = [AIStateIndicator_1.AIStates.Thinking, AIStateIndicator_1.AIStates.Generating].includes(aiState) &&
        !!StopAIGenerationButton;
    return (<WithDragAndDropUpload_1.WithDragAndDropUpload className='str-chat__message-input' component='div'>
      {recordingEnabled &&
            recordingController.permissionState === 'denied' &&
            showRecordingPermissionDeniedNotification && (<RecordingPermissionDeniedNotification onClose={closePermissionDeniedNotification} permissionName={MediaRecorder_1.RecordingPermission.MIC}/>)}
      <LinkPreviewList />
      <QuotedMessagePreview_1.QuotedMessagePreviewHeader />

      <div className='str-chat__message-input-inner'>
        <AttachmentSelector />
        <div className='str-chat__message-textarea-container'>
          <QuotedMessagePreview />
          <AttachmentPreviewList />
          <div className='str-chat__message-textarea-with-emoji-picker'>
            <TextareaComposer />
            {EmojiPicker && <EmojiPicker />}
          </div>
        </div>
        {shouldDisplayStopAIGeneration ? (<StopAIGenerationButton onClick={stopGenerating}/>) : (!hideSendButton && (<>
              {cooldownRemaining ? (<CooldownTimer cooldownInterval={cooldownRemaining} setCooldownRemaining={setCooldownRemaining}/>) : (<>
                  <SendButton sendMessage={handleSubmit}/>
                  {recordingEnabled && (<StartRecordingAudioButton disabled={isRecording ||
                        (!asyncMessagesMultiSendEnabled &&
                            attachments.some(function (a) { return a.type === classes_1.RecordingAttachmentType.VOICE_RECORDING; }))} onClick={function () {
                        var _a;
                        (_a = recordingController.recorder) === null || _a === void 0 ? void 0 : _a.start();
                        setShowRecordingPermissionDeniedNotification(true);
                    }}/>)}
                </>)}
            </>))}
      </div>
      <SendToChannelCheckbox />
    </WithDragAndDropUpload_1.WithDragAndDropUpload>);
};
exports.MessageInputFlat = MessageInputFlat;
