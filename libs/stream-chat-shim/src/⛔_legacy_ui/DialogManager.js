"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogManager = void 0;
var nanoid_1 = require("nanoid");
var stream_chat_1 = require("stream-chat");
/**
 * Placeholder implementation of the DialogManager class. The public API mirrors
 * Stream Chat React's DialogManager but methods do not provide real behaviour.
 */
var DialogManager = /** @class */ (function () {
    function DialogManager(_a) {
        var _b = _a === void 0 ? {} : _a, id = _b.id;
        this.state = new stream_chat_1.StateStore({ dialogsById: {} });
        this.id = id !== null && id !== void 0 ? id : (0, nanoid_1.nanoid)();
    }
    Object.defineProperty(DialogManager.prototype, "openDialogCount", {
        get: function () {
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    DialogManager.prototype.getOrCreate = function (_a) {
        var _this = this;
        var id = _a.id;
        return {
            id: id,
            isOpen: false,
            open: function () { return _this.open({ id: id }); },
            close: function () { return _this.close(id); },
            toggle: function (closeAll) { return _this.toggle({ id: id }, closeAll); },
            remove: function () { return _this.remove(id); },
            removalTimeout: undefined,
        };
    };
    DialogManager.prototype.open = function (_params, _closeRest) {
        throw new Error('DialogManager.open not implemented');
    };
    DialogManager.prototype.close = function (_id) {
        throw new Error('DialogManager.close not implemented');
    };
    DialogManager.prototype.closeAll = function () {
        throw new Error('DialogManager.closeAll not implemented');
    };
    DialogManager.prototype.toggle = function (_params, _closeAll) {
        if (_closeAll === void 0) { _closeAll = false; }
        throw new Error('DialogManager.toggle not implemented');
    };
    DialogManager.prototype.remove = function (_id) {
        throw new Error('DialogManager.remove not implemented');
    };
    DialogManager.prototype.markForRemoval = function (_id) {
        throw new Error('DialogManager.markForRemoval not implemented');
    };
    return DialogManager;
}());
exports.DialogManager = DialogManager;
exports.default = DialogManager;
