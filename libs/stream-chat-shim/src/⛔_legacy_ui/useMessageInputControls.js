"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageInputControls = void 0;
var react_1 = require("react");
var useMediaRecorder_1 = require("./useMediaRecorder");
var useTextareaRefPlaceholder = function (props) {
    var focus = props.focus;
    var textareaRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(function () {
        if (focus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [focus]);
    return { textareaRef: textareaRef };
};
var useSubmitHandlerPlaceholder = function (_props) {
    var handleSubmit = (0, react_1.useCallback)(function (_event) {
        throw new Error('useSubmitHandler not implemented');
    }, []);
    return { handleSubmit: handleSubmit };
};
var usePasteHandlerPlaceholder = function () {
    var onPaste = (0, react_1.useCallback)(function (_event) {
        // TODO: implement paste handling
    }, []);
    return { onPaste: onPaste };
};
var useMessageInputControls = function (props) {
    var _a = props, asyncMessagesMultiSendEnabled = _a.asyncMessagesMultiSendEnabled, audioRecordingConfig = _a.audioRecordingConfig, audioRecordingEnabled = _a.audioRecordingEnabled;
    var textareaRef = useTextareaRefPlaceholder(props).textareaRef;
    var handleSubmit = useSubmitHandlerPlaceholder(props).handleSubmit;
    var recordingController = (0, useMediaRecorder_1.useMediaRecorder)({
        asyncMessagesMultiSendEnabled: !!asyncMessagesMultiSendEnabled,
        enabled: !!audioRecordingEnabled,
        handleSubmit: function () { return handleSubmit(); },
        recordingConfig: audioRecordingConfig,
    });
    var onPaste = usePasteHandlerPlaceholder().onPaste;
    return {
        handleSubmit: handleSubmit,
        onPaste: onPaste,
        recordingController: recordingController,
        textareaRef: textareaRef,
    };
};
exports.useMessageInputControls = useMessageInputControls;
exports.default = exports.useMessageInputControls;
