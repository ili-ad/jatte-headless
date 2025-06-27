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
exports.AttachmentSelector = exports.defaultAttachmentSelectorActionSet = exports.DefaultAttachmentSelectorComponents = exports.SimpleAttachmentSelector = void 0;
var react_1 = require("react");
var icons_1 = require("./icons");
var useAttachmentManagerState_1 = require("./hooks/useAttachmentManagerState");
var constants_1 = require("../Channel/constants");
var Dialog_1 = require("../Dialog");
var DialogMenu_1 = require("../Dialog/DialogMenu");
var Modal_1 = require("../Modal");
var Poll_1 = require("../Poll");
var Portal_1 = require("../Portal/Portal");
var ReactFileUtilities_1 = require("../ReactFileUtilities");
var context_1 = require("../../context");
var AttachmentSelectorContext_1 = require("../../context/AttachmentSelectorContext");
var useStableId_1 = require("../UtilityComponents/useStableId");
var SimpleAttachmentSelector = function () {
    var _a = (0, context_1.useComponentContext)(), AttachmentSelectorInitiationButtonContents = _a.AttachmentSelectorInitiationButtonContents, _b = _a.FileUploadIcon, FileUploadIcon = _b === void 0 ? icons_1.UploadIcon : _b;
    var inputRef = (0, react_1.useRef)(null);
    var _c = (0, react_1.useState)(null), labelElement = _c[0], setLabelElement = _c[1];
    var id = (0, useStableId_1.useStableId)();
    (0, react_1.useEffect)(function () {
        if (!labelElement)
            return;
        var handleKeyUp = function (event) {
            if (![' ', 'Enter'].includes(event.key) || !inputRef.current)
                return;
            event.preventDefault();
            inputRef.current.click();
        };
        labelElement.addEventListener('keyup', handleKeyUp);
        return function () {
            labelElement.removeEventListener('keyup', handleKeyUp);
        };
    }, [labelElement]);
    return (<div className='str-chat__file-input-container' data-testid='file-upload-button'>
      <ReactFileUtilities_1.UploadFileInput id={id} ref={inputRef}/>
      <label className='str-chat__file-input-label' htmlFor={id} ref={setLabelElement} tabIndex={0}>
        {AttachmentSelectorInitiationButtonContents ? (<AttachmentSelectorInitiationButtonContents />) : (<FileUploadIcon />)}
      </label>
    </div>);
};
exports.SimpleAttachmentSelector = SimpleAttachmentSelector;
var AttachmentSelectorMenuInitButtonIcon = function () {
    var _a = (0, context_1.useComponentContext)('SimpleAttachmentSelector'), AttachmentSelectorInitiationButtonContents = _a.AttachmentSelectorInitiationButtonContents, FileUploadIcon = _a.FileUploadIcon;
    if (AttachmentSelectorInitiationButtonContents) {
        return <AttachmentSelectorInitiationButtonContents />;
    }
    if (FileUploadIcon) {
        return <FileUploadIcon />;
    }
    return <div className='str-chat__attachment-selector__menu-button__icon'/>;
};
exports.DefaultAttachmentSelectorComponents = {
    File: function (_a) {
        var closeMenu = _a.closeMenu;
        var t = (0, context_1.useTranslationContext)().t;
        var fileInput = (0, AttachmentSelectorContext_1.useAttachmentSelectorContext)().fileInput;
        var isUploadEnabled = (0, useAttachmentManagerState_1.useAttachmentManagerState)().isUploadEnabled;
        return (<DialogMenu_1.DialogMenuButton className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__upload-file-button' disabled={!isUploadEnabled} // todo: add styles for disabled state
         onClick={function () {
                if (fileInput)
                    fileInput.click();
                closeMenu();
            }}>
        {t('File')}
      </DialogMenu_1.DialogMenuButton>);
    },
    Poll: function (_a) {
        var closeMenu = _a.closeMenu, openModalForAction = _a.openModalForAction;
        var t = (0, context_1.useTranslationContext)().t;
        return (<DialogMenu_1.DialogMenuButton className='str-chat__attachment-selector-actions-menu__button str-chat__attachment-selector-actions-menu__create-poll-button' onClick={function () {
                openModalForAction('createPoll');
                closeMenu();
            }}>
        {t('Poll')}
      </DialogMenu_1.DialogMenuButton>);
    },
};
exports.defaultAttachmentSelectorActionSet = [
    { ActionButton: exports.DefaultAttachmentSelectorComponents.File, type: 'uploadFile' },
    {
        ActionButton: exports.DefaultAttachmentSelectorComponents.Poll,
        type: 'createPoll',
    },
];
var useAttachmentSelectorActionsFiltered = function (original) {
    var _a = (0, context_1.useComponentContext)().PollCreationDialog, PollCreationDialog = _a === void 0 ? Poll_1.PollCreationDialog : _a;
    var _b = (0, context_1.useChannelStateContext)(), channelCapabilities = _b.channelCapabilities, channelConfig = _b.channelConfig;
    var isThreadInput = (0, context_1.useMessageInputContext)().isThreadInput;
    return original
        .filter(function (action) {
        if (action.type === 'uploadFile' && !channelCapabilities['upload-file'])
            return false;
        if (action.type === 'createPoll' &&
            (!(channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.polls) || isThreadInput || !channelCapabilities['send-poll']))
            return false;
        return true;
    })
        .map(function (action) {
        if (action.type === 'createPoll' && !action.ModalContent) {
            return __assign(__assign({}, action), { ModalContent: PollCreationDialog });
        }
        return action;
    });
};
var AttachmentSelector = function (_a) {
    var _b = _a.attachmentSelectorActionSet, attachmentSelectorActionSet = _b === void 0 ? exports.defaultAttachmentSelectorActionSet : _b, getModalPortalDestination = _a.getModalPortalDestination;
    var t = (0, context_1.useTranslationContext)().t;
    var channelCapabilities = (0, context_1.useChannelStateContext)().channelCapabilities;
    var isThreadInput = (0, context_1.useMessageInputContext)().isThreadInput;
    var actions = useAttachmentSelectorActionsFiltered(attachmentSelectorActionSet);
    var menuDialogId = "attachment-actions-menu".concat(isThreadInput ? '-thread' : '');
    var menuDialog = (0, Dialog_1.useDialog)({ id: menuDialogId });
    var menuDialogIsOpen = (0, Dialog_1.useDialogIsOpen)(menuDialogId);
    var _c = (0, react_1.useState)(), modalContentAction = _c[0], setModalContentActionAction = _c[1];
    var openModal = (0, react_1.useCallback)(function (actionType) {
        var action = actions.find(function (a) { return a.type === actionType; });
        if (!(action === null || action === void 0 ? void 0 : action.ModalContent))
            return;
        setModalContentActionAction(action);
    }, [actions]);
    var closeModal = (0, react_1.useCallback)(function () { return setModalContentActionAction(undefined); }, []);
    var _d = (0, react_1.useState)(null), fileInput = _d[0], setFileInput = _d[1];
    var menuButtonRef = (0, react_1.useRef)(null);
    var getDefaultPortalDestination = (0, react_1.useCallback)(function () { return document.getElementById(constants_1.CHANNEL_CONTAINER_ID); }, []);
    if (actions.length === 0)
        return null;
    if (actions.length === 1 && actions[0].type === 'uploadFile')
        return <exports.SimpleAttachmentSelector />;
    var ModalContent = modalContentAction === null || modalContentAction === void 0 ? void 0 : modalContentAction.ModalContent;
    var modalIsOpen = !!ModalContent;
    return (<AttachmentSelectorContext_1.AttachmentSelectorContextProvider value={{ fileInput: fileInput }}>
      <div className='str-chat__attachment-selector'>
        {channelCapabilities['upload-file'] && <ReactFileUtilities_1.UploadFileInput ref={setFileInput}/>}
        <button aria-expanded={menuDialogIsOpen} aria-haspopup='true' aria-label={t('aria/Open Attachment Selector')} className='str-chat__attachment-selector__menu-button' data-testid='invoke-attachment-selector-button' onClick={function () { return menuDialog === null || menuDialog === void 0 ? void 0 : menuDialog.toggle(); }} ref={menuButtonRef}>
          <AttachmentSelectorMenuInitButtonIcon />
        </button>
        <Dialog_1.DialogAnchor id={menuDialogId} placement='top-start' referenceElement={menuButtonRef.current} tabIndex={-1} trapFocus>
          <div className='str-chat__attachment-selector-actions-menu str-chat__dialog-menu' data-testid='attachment-selector-actions-menu'>
            {actions.map(function (_a) {
            var ActionButton = _a.ActionButton, type = _a.type;
            return (<ActionButton closeMenu={menuDialog.close} key={"attachment-selector-item-".concat(type)} openModalForAction={openModal}/>);
        })}
          </div>
        </Dialog_1.DialogAnchor>
        <Portal_1.Portal getPortalDestination={getModalPortalDestination !== null && getModalPortalDestination !== void 0 ? getModalPortalDestination : getDefaultPortalDestination} isOpen={modalIsOpen}>
          <Modal_1.Modal className='str-chat__create-poll-modal' onClose={closeModal} open={modalIsOpen}>
            {ModalContent && <ModalContent close={closeModal}/>}
          </Modal_1.Modal>
        </Portal_1.Portal>
      </div>
    </AttachmentSelectorContext_1.AttachmentSelectorContextProvider>);
};
exports.AttachmentSelector = AttachmentSelector;
