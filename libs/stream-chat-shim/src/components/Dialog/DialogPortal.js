"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogPortalEntry = exports.DialogPortalDestination = void 0;
var react_1 = require("react");
var useDialogIsOpen = function (_id) { return false; }; // temporary shim
var useOpenedDialogCount = function () { return 0; }; // temporary shim
var Portal = function (_a) {
    var children = _a.children;
    return <>{children}</>;
}; // temporary shim
var useDialogManager = function () { return ({ dialogManager: { id: '', closeAll: function () { } } }); }; // temporary shim
var DialogPortalDestination = function () {
    var dialogManager = useDialogManager().dialogManager;
    var openedDialogCount = useOpenedDialogCount();
    return (<div className='str-chat__dialog-overlay' data-str-chat__portal-id={dialogManager.id} data-testid='str-chat__dialog-overlay' onClick={function () { return dialogManager.closeAll(); }} style={{
            '--str-chat__dialog-overlay-height': openedDialogCount > 0 ? '100%' : '0',
        }}/>);
};
exports.DialogPortalDestination = DialogPortalDestination;
var DialogPortalEntry = function (_a) {
    var children = _a.children, dialogId = _a.dialogId;
    var dialogManager = useDialogManager().dialogManager;
    var dialogIsOpen = useDialogIsOpen(dialogId);
    var getPortalDestination = (0, react_1.useCallback)(function () { return document.querySelector("div[data-str-chat__portal-id=\"".concat(dialogManager.id, "\"]")); }, [dialogManager.id]);
    return (<Portal getPortalDestination={getPortalDestination} isOpen={dialogIsOpen}>
      {children}
    </Portal>);
};
exports.DialogPortalEntry = DialogPortalEntry;
