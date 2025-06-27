"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var focus_1 = require("@react-aria/focus");
var icons_1 = require("./icons");
var context_1 = require("../../context");
var Modal = function (_a) {
    var children = _a.children, className = _a.className, onClose = _a.onClose, open = _a.open;
    var t = (0, context_1.useTranslationContext)('Modal').t;
    var innerRef = (0, react_1.useRef)(null);
    var closeRef = (0, react_1.useRef)(null);
    var handleClick = function (event) {
        var target = event.target;
        if (!innerRef.current || !closeRef.current)
            return;
        if (!innerRef.current.contains(target) || closeRef.current.contains(target))
            onClose === null || onClose === void 0 ? void 0 : onClose(event);
    };
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        var handleKeyDown = function (event) {
            if (event.key === 'Escape')
                onClose === null || onClose === void 0 ? void 0 : onClose(event);
        };
        document.addEventListener('keydown', handleKeyDown);
        return function () { return document.removeEventListener('keydown', handleKeyDown); };
    }, [onClose, open]);
    if (!open)
        return null;
    return (<div className={(0, clsx_1.default)('str-chat__modal str-chat__modal--open', className)} onClick={handleClick}>
      <focus_1.FocusScope autoFocus contain>
        <button className='str-chat__modal__close-button' ref={closeRef} title={t('Close')}>
          <icons_1.CloseIconRound />
        </button>
        <div className='str-chat__modal__inner str-chat-react__modal__inner' ref={innerRef}>
          {children}
        </div>
      </focus_1.FocusScope>
    </div>);
};
exports.Modal = Modal;
