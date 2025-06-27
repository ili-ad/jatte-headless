"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollAction = void 0;
var react_1 = require("react");
var Modal_1 = require("../../Modal");
var PollAction = function (_a) {
    var buttonText = _a.buttonText, children = _a.children, closeModal = _a.closeModal, modalClassName = _a.modalClassName, modalIsOpen = _a.modalIsOpen, openModal = _a.openModal;
    return (<>
    <button className='str-chat__poll-action' onClick={openModal}>
      {buttonText}
    </button>
    <Modal_1.Modal className={modalClassName} onClose={closeModal} open={modalIsOpen}>
      {children}
    </Modal_1.Modal>
  </>);
};
exports.PollAction = PollAction;
