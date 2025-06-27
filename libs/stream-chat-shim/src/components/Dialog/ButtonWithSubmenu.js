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
exports.ButtonWithSubmenu = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var hooks_1 = require("./hooks");
var DialogAnchor_1 = require("./DialogAnchor");
var ButtonWithSubmenu = function (_a) {
    var children = _a.children, className = _a.className, placement = _a.placement, Submenu = _a.Submenu, submenuContainerProps = _a.submenuContainerProps, buttonProps = __rest(_a, ["children", "className", "placement", "Submenu", "submenuContainerProps"]);
    var buttonRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(null), dialogContainer = _b[0], setDialogContainer = _b[1];
    var keepSubmenuOpen = (0, react_1.useRef)(false);
    var dialogCloseTimeout = (0, react_1.useRef)(null);
    var dialogId = (0, react_1.useMemo)(function () { return "submenu-".concat(Math.random().toString(36).slice(2)); }, []);
    var dialog = (0, hooks_1.useDialog)({ id: dialogId });
    var dialogIsOpen = (0, hooks_1.useDialogIsOpen)(dialogId);
    var _c = (0, DialogAnchor_1.useDialogAnchor)({
        open: dialogIsOpen,
        placement: placement,
        referenceElement: buttonRef.current,
    }), attributes = _c.attributes, setPopperElement = _c.setPopperElement, styles = _c.styles;
    var closeDialogLazily = (0, react_1.useCallback)(function () {
        if (dialogCloseTimeout.current)
            clearTimeout(dialogCloseTimeout.current);
        dialogCloseTimeout.current = setTimeout(function () {
            if (keepSubmenuOpen.current)
                return;
            dialog.close();
        }, 100);
    }, [dialog]);
    var handleClose = (0, react_1.useCallback)(function (event) {
        var parentButton = buttonRef.current;
        if (!dialogIsOpen || !parentButton)
            return;
        event.stopPropagation();
        closeDialogLazily();
        parentButton.focus();
    }, [closeDialogLazily, dialogIsOpen, buttonRef]);
    var handleFocusParentButton = function () {
        if (dialogIsOpen)
            return;
        dialog.open();
        keepSubmenuOpen.current = true;
    };
    (0, react_1.useEffect)(function () {
        var parentButton = buttonRef.current;
        if (!dialogIsOpen || !parentButton)
            return;
        var hideOnEscape = function (event) {
            if (event.key !== 'Escape')
                return;
            handleClose(event);
            keepSubmenuOpen.current = false;
        };
        document.addEventListener('keyup', hideOnEscape, { capture: true });
        return function () {
            document.removeEventListener('keyup', hideOnEscape, { capture: true });
        };
    }, [dialogIsOpen, handleClose]);
    return (<>
      <button aria-selected='false' className={(0, clsx_1.default)(className, 'str_chat__button-with-submenu', {
            'str_chat__button-with-submenu--submenu-open': dialogIsOpen,
        })} onBlur={function () {
            keepSubmenuOpen.current = false;
            closeDialogLazily();
        }} onClick={function (event) {
            event.stopPropagation();
            dialog.toggle();
        }} onFocus={handleFocusParentButton} onMouseEnter={handleFocusParentButton} onMouseLeave={function () {
            keepSubmenuOpen.current = false;
            closeDialogLazily();
        }} ref={buttonRef} role='option' {...buttonProps}>
        {children}
      </button>
      {dialogIsOpen && (<div {...attributes.popper} onBlur={function (event) {
                var isBlurredDescendant = event.relatedTarget instanceof Node &&
                    (dialogContainer === null || dialogContainer === void 0 ? void 0 : dialogContainer.contains(event.relatedTarget));
                if (isBlurredDescendant)
                    return;
                keepSubmenuOpen.current = false;
                closeDialogLazily();
            }} onFocus={function () {
                keepSubmenuOpen.current = true;
            }} onMouseEnter={function () {
                keepSubmenuOpen.current = true;
            }} onMouseLeave={function () {
                keepSubmenuOpen.current = false;
                closeDialogLazily();
            }} ref={function (element) {
                setPopperElement(element);
                setDialogContainer(element);
            }} style={styles.popper} tabIndex={-1} {...submenuContainerProps}>
          <Submenu />
        </div>)}
    </>);
};
exports.ButtonWithSubmenu = ButtonWithSubmenu;
