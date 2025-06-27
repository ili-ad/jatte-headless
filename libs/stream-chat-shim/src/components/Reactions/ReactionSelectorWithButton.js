"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionSelectorWithButton = void 0;
var react_1 = require("react");
var ReactionSelector_1 = require("./ReactionSelector");
var Dialog_1 = require("../Dialog");
var context_1 = require("../../context");
/**
 * Internal convenience component - not to be exported. It just groups the button and the dialog anchor and thus prevents
 * cluttering the parent component.
 */
var ReactionSelectorWithButton = function (_a) {
    var ReactionIcon = _a.ReactionIcon;
    var t = (0, context_1.useTranslationContext)('ReactionSelectorWithButton').t;
    var _b = (0, context_1.useMessageContext)('MessageOptions'), isMyMessage = _b.isMyMessage, message = _b.message;
    var _c = (0, context_1.useComponentContext)('MessageOptions').ReactionSelector, ReactionSelector = _c === void 0 ? ReactionSelector_1.ReactionSelector : _c;
    var buttonRef = (0, react_1.useRef)(null);
    var dialogId = "reaction-selector--".concat(message.id);
    var dialog = (0, Dialog_1.useDialog)({ id: dialogId });
    var dialogIsOpen = (0, Dialog_1.useDialogIsOpen)(dialogId);
    return (<>
      <Dialog_1.DialogAnchor id={dialogId} placement={isMyMessage() ? 'top-end' : 'top-start'} referenceElement={buttonRef.current} trapFocus>
        <ReactionSelector />
      </Dialog_1.DialogAnchor>
      <button aria-expanded={dialogIsOpen} aria-label={t('aria/Open Reaction Selector')} className='str-chat__message-reactions-button' data-testid='message-reaction-action' onClick={function () { return dialog === null || dialog === void 0 ? void 0 : dialog.toggle(); }} ref={buttonRef}>
        <ReactionIcon className='str-chat__message-action-icon'/>
      </button>
    </>);
};
exports.ReactionSelectorWithButton = ReactionSelectorWithButton;
