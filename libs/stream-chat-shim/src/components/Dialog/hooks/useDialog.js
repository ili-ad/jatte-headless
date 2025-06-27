"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOpenedDialogCount = exports.useDialogIsOpen = exports.useDialog = void 0;
var react_1 = require("react");
var context_1 = require("../../../context");
var store_1 = require("../../../store");
var useDialog = function (_a) {
    var id = _a.id;
    var dialogManager = (0, context_1.useDialogManager)().dialogManager;
    (0, react_1.useEffect)(function () { return function () {
        // Since this cleanup can run even if the component is still mounted
        // and dialog id is unchanged (e.g. in <StrictMode />), it's safer to
        // mark state as unused and only remove it after a timeout, rather than
        // to remove it immediately.
        dialogManager.markForRemoval(id);
    }; }, [dialogManager, id]);
    return dialogManager.getOrCreate({ id: id });
};
exports.useDialog = useDialog;
var useDialogIsOpen = function (id) {
    var dialogManager = (0, context_1.useDialogManager)().dialogManager;
    var dialogIsOpenSelector = (0, react_1.useCallback)(function (_a) {
        var _b;
        var dialogsById = _a.dialogsById;
        return ({ isOpen: !!((_b = dialogsById[id]) === null || _b === void 0 ? void 0 : _b.isOpen) });
    }, [id]);
    return (0, store_1.useStateStore)(dialogManager.state, dialogIsOpenSelector).isOpen;
};
exports.useDialogIsOpen = useDialogIsOpen;
var openedDialogCountSelector = function (nextValue) { return ({
    openedDialogCount: Object.values(nextValue.dialogsById).reduce(function (count, dialog) {
        if (dialog.isOpen)
            return count + 1;
        return count;
    }, 0),
}); };
var useOpenedDialogCount = function () {
    var dialogManager = (0, context_1.useDialogManager)().dialogManager;
    return (0, store_1.useStateStore)(dialogManager.state, openedDialogCountSelector).openedDialogCount;
};
exports.useOpenedDialogCount = useOpenedDialogCount;
