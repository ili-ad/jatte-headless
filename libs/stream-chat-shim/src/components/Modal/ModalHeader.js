"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalHeader = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var ModalHeader = function (_a) {
    var className = _a.className, close = _a.close, goBack = _a.goBack, title = _a.title;
    return (<div className={(0, clsx_1.default)('str-chat__modal-header', className)}>
    {goBack && (<button className='str-chat__modal-header__go-back-button' onClick={goBack}/>)}
    <div className='str-chat__modal-header__title'>{title}</div>
    {close && <button className='str-chat__modal-header__close-button' onClick={close}/>}
  </div>);
};
exports.ModalHeader = ModalHeader;
