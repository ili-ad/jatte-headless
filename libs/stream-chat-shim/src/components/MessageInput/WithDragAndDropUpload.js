"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithDragAndDropUpload = exports.useRegisterDropHandlers = exports.useDragAndDropUploadContext = void 0;
var react_1 = require("react");
var react_dropzone_1 = require("react-dropzone");
var clsx_1 = require("clsx");
var useMessageInputContext = function (_) { return ({}); }; // temporary shim
var useTranslationContext = function (_) { return ({ t: function (key) { return key; } }); }; // temporary shim
var useAttachmentManagerState = function () { return ({ isUploadEnabled: false }); }; // temporary shim
var useMessageComposer = function () { return ({
    attachmentManager: { uploadFiles: function (_f) { return Promise.resolve(); } },
    configState: {},
}); }; // temporary shim
var useStateStore = function (_store, selector) {
    return selector({ attachments: { acceptedFiles: [], maxNumberOfFilesPerMessage: 1 } });
};
var DragAndDropUploadContext = react_1.default.createContext({
    subscribeToDrop: null,
});
var useDragAndDropUploadContext = function () { return (0, react_1.useContext)(DragAndDropUploadContext); };
exports.useDragAndDropUploadContext = useDragAndDropUploadContext;
/**
 * @private This hook should be used only once directly in the `MessageInputProvider` to
 * register `uploadNewFiles` functions of the rendered `MessageInputs`. Each `MessageInput`
 * will then be notified when the drop event occurs from within the `WithDragAndDropUpload`
 * component.
 */
var useRegisterDropHandlers = function () {
    var subscribeToDrop = (0, exports.useDragAndDropUploadContext)().subscribeToDrop;
    var messageComposer = useMessageComposer();
    (0, react_1.useEffect)(function () {
        var unsubscribe = subscribeToDrop === null || subscribeToDrop === void 0 ? void 0 : subscribeToDrop(messageComposer.attachmentManager.uploadFiles);
        return unsubscribe;
    }, [subscribeToDrop, messageComposer]);
};
exports.useRegisterDropHandlers = useRegisterDropHandlers;
var attachmentManagerConfigStateSelector = function (state) { return ({
    acceptedFiles: state.attachments.acceptedFiles,
    multipleUploads: state.attachments.maxNumberOfFilesPerMessage > 1,
}); };
/**
 * Wrapper to replace now deprecated `Channel.dragAndDropWindow` option.
 *
 * @example
 * ```tsx
 * <Channel>
 *  <WithDragAndDropUpload component="section" className="message-list-dnd-wrapper">
 *    <Window>
 *      <MessageList />
 *      <MessageInput />
 *    </Window>
 *  </WithDragAndDropUpload>
 *  <Thread />
 * <Channel>
 * ```
 */
var WithDragAndDropUpload = function (_a) {
    var _b;
    var children = _a.children, className = _a.className, _c = _a.component, Component = _c === void 0 ? 'div' : _c, style = _a.style;
    var dropHandlersRef = (0, react_1.useRef)(new Set());
    var t = useTranslationContext().t;
    var messageInputContext = useMessageInputContext();
    var dragAndDropUploadContext = (0, exports.useDragAndDropUploadContext)();
    var messageComposer = useMessageComposer();
    var isUploadEnabled = useAttachmentManagerState().isUploadEnabled;
    var _d = useStateStore(messageComposer.configState, attachmentManagerConfigStateSelector), acceptedFiles = _d.acceptedFiles, multipleUploads = _d.multipleUploads;
    // if message input context is available, there's no need to use the queue
    var isWithinMessageInputContext = Object.keys(messageInputContext).length > 0;
    var accept = (0, react_1.useMemo)(function () {
        return acceptedFiles.reduce(function (mediaTypeMap, mediaType) {
            var _a;
            (_a = mediaTypeMap[mediaType]) !== null && _a !== void 0 ? _a : (mediaTypeMap[mediaType] = []);
            return mediaTypeMap;
        }, {});
    }, [acceptedFiles]);
    var subscribeToDrop = (0, react_1.useCallback)(function (fn) {
        dropHandlersRef.current.add(fn);
        return function () {
            dropHandlersRef.current.delete(fn);
        };
    }, []);
    var handleDrop = (0, react_1.useCallback)(function (files) {
        dropHandlersRef.current.forEach(function (fn) { return fn(files); });
    }, []);
    var _e = (0, react_dropzone_1.useDropzone)({
        accept: accept,
        // apply `disabled` rules if available, otherwise allow anything and
        // let the `uploadNewFiles` handle the limitations internally
        disabled: isWithinMessageInputContext
            ? !isUploadEnabled || ((_b = messageInputContext.cooldownRemaining) !== null && _b !== void 0 ? _b : 0) > 0
            : false,
        multiple: multipleUploads,
        noClick: true,
        onDrop: isWithinMessageInputContext
            ? messageComposer.attachmentManager.uploadFiles
            : handleDrop,
    }), getRootProps = _e.getRootProps, isDragActive = _e.isDragActive, isDragReject = _e.isDragReject;
    // nested WithDragAndDropUpload components render wrappers without functionality
    // (MessageInputFlat has a default WithDragAndDropUpload)
    if (dragAndDropUploadContext.subscribeToDrop !== null) {
        return <Component className={className}>{children}</Component>;
    }
    return (<DragAndDropUploadContext.Provider value={{
            subscribeToDrop: subscribeToDrop,
        }}>
      <Component {...getRootProps({ className: className, style: style })}>
        {/* TODO: could be a replaceable component */}
        {isDragActive && (<div className={(0, clsx_1.default)('str-chat__dropzone-container', {
                'str-chat__dropzone-container--not-accepted': isDragReject,
            })}>
            {!isDragReject && <p>{t('Drag your files here')}</p>}
            {isDragReject && <p>{t('Some of the files will not be accepted')}</p>}
          </div>)}
        {children}
      </Component>
    </DragAndDropUploadContext.Provider>);
};
exports.WithDragAndDropUpload = WithDragAndDropUpload;
