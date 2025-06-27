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
exports.MessageInput = void 0;
var react_1 = require("react");
var MessageInputFlat_1 = require("./MessageInputFlat");
var hooks_1 = require("./hooks");
var useCooldownTimer_1 = require("./hooks/useCooldownTimer");
var useCreateMessageInputContext_1 = require("./hooks/useCreateMessageInputContext");
var useMessageInputControls_1 = require("./hooks/useMessageInputControls");
var ComponentContext_1 = require("../../context/ComponentContext");
var MessageInputContext_1 = require("../../context/MessageInputContext");
var context_1 = require("../../context");
var useStableId_1 = require("../UtilityComponents/useStableId");
var WithDragAndDropUpload_1 = require("./WithDragAndDropUpload");
var MessageInputProvider = function (props) {
    var _a;
    var cooldownTimerState = (0, useCooldownTimer_1.useCooldownTimer)();
    var messageInputUiApi = (0, useMessageInputControls_1.useMessageInputControls)(props);
    var emojiSearchIndex = (0, ComponentContext_1.useComponentContext)('MessageInput').emojiSearchIndex;
    var messageInputContextValue = (0, useCreateMessageInputContext_1.useCreateMessageInputContext)(__assign(__assign(__assign(__assign({}, cooldownTimerState), messageInputUiApi), props), { emojiSearchIndex: (_a = props.emojiSearchIndex) !== null && _a !== void 0 ? _a : emojiSearchIndex }));
    var messageComposer = (0, hooks_1.useMessageComposer)();
    (0, react_1.useEffect)(function () { return function () {
        messageComposer.createDraft();
    }; }, [messageComposer]);
    (0, react_1.useEffect)(function () {
        var threadId = messageComposer.threadId;
        if (!threadId || !messageComposer.channel || !messageComposer.compositionIsEmpty)
            return;
        // get draft data for legacy thread composer
        Promise.resolve({ draft: undefined }).then(function (_a) {
            var draft = _a.draft;
            if (draft) {
                messageComposer.initState({ composition: draft });
            }
        });
    }, [messageComposer]);
    (0, WithDragAndDropUpload_1.useRegisterDropHandlers)();
    return (<MessageInputContext_1.MessageInputContextProvider value={messageInputContextValue}>
      {props.children}
    </MessageInputContext_1.MessageInputContextProvider>);
};
var UnMemoizedMessageInput = function (props) {
    var PropInput = props.Input;
    var ContextInput = (0, ComponentContext_1.useComponentContext)('MessageInput').Input;
    var id = (0, useStableId_1.useStableId)();
    var Input = PropInput || ContextInput || MessageInputFlat_1.MessageInputFlat;
    var dialogManagerId = props.isThreadInput
        ? "message-input-dialog-manager-thread-".concat(id)
        : "message-input-dialog-manager-".concat(id);
    return (<context_1.DialogManagerProvider id={dialogManagerId}>
      <MessageInputProvider {...props}>
        <Input />
      </MessageInputProvider>
    </context_1.DialogManagerProvider>);
};
/**
 * A high level component that has provides all functionality to the Input it renders.
 */
exports.MessageInput = react_1.default.memo(UnMemoizedMessageInput);
