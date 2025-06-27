"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogAnchor = void 0;
exports.useDialogAnchor = useDialogAnchor;
var clsx_1 = require("clsx");
var react_1 = require("react");
var focus_1 = require("@react-aria/focus");
var react_popper_1 = require("react-popper");
var DialogPortal_1 = require("./DialogPortal");
var hooks_1 = require("./hooks");
function useDialogAnchor(_a) {
    var open = _a.open, placement = _a.placement, referenceElement = _a.referenceElement;
    var _b = (0, react_1.useState)(null), popperElement = _b[0], setPopperElement = _b[1];
    var _c = (0, react_popper_1.usePopper)(referenceElement, popperElement, {
        modifiers: [
            {
                name: 'eventListeners',
                options: {
                    // It's not safe to update popper position on resize and scroll, since popper's
                    // reference element might not be visible at the time.
                    resize: false,
                    scroll: false,
                },
            },
        ],
        placement: placement,
    }), attributes = _c.attributes, styles = _c.styles, update = _c.update;
    (0, react_1.useEffect)(function () {
        if (open && popperElement) {
            // Since the popper's reference element might not be (and usually is not) visible
            // all the time, it's safer to force popper update before showing it.
            // update is non-null only if popperElement is non-null
            update === null || update === void 0 ? void 0 : update();
        }
    }, [open, popperElement, update]);
    if (popperElement && !open) {
        setPopperElement(null);
    }
    return {
        attributes: attributes,
        setPopperElement: setPopperElement,
        styles: styles,
    };
}
var DialogAnchor = function (_a) {
    var children = _a.children, className = _a.className, _b = _a.focus, focus = _b === void 0 ? true : _b, id = _a.id, _c = _a.placement, placement = _c === void 0 ? 'auto' : _c, _d = _a.referenceElement, referenceElement = _d === void 0 ? null : _d, tabIndex = _a.tabIndex, trapFocus = _a.trapFocus, restDivProps = __rest(_a, ["children", "className", "focus", "id", "placement", "referenceElement", "tabIndex", "trapFocus"]);
    var dialog = (0, hooks_1.useDialog)({ id: id });
    var open = (0, hooks_1.useDialogIsOpen)(id);
    var _e = useDialogAnchor({
        open: open,
        placement: placement,
        referenceElement: referenceElement,
    }), attributes = _e.attributes, setPopperElement = _e.setPopperElement, styles = _e.styles;
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        var hideOnEscape = function (event) {
            if (event.key !== 'Escape')
                return;
            dialog === null || dialog === void 0 ? void 0 : dialog.close();
        };
        document.addEventListener('keyup', hideOnEscape);
        return function () {
            document.removeEventListener('keyup', hideOnEscape);
        };
    }, [dialog, open]);
    // prevent rendering the dialog contents if the dialog should not be open / shown
    if (!open) {
        return null;
    }
    return (<DialogPortal_1.DialogPortalEntry dialogId={id}>
      <focus_1.FocusScope autoFocus={focus} contain={trapFocus} restoreFocus>
        <div {...restDivProps} {...attributes.popper} className={(0, clsx_1.default)('str-chat__dialog-contents', className)} data-testid='str-chat__dialog-contents' ref={setPopperElement} style={styles.popper} tabIndex={typeof tabIndex !== 'undefined' ? tabIndex : 0}>
          {children}
        </div>
      </focus_1.FocusScope>
    </DialogPortal_1.DialogPortalEntry>);
};
exports.DialogAnchor = DialogAnchor;
