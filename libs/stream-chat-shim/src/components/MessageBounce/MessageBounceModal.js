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
exports.MessageBounceModal = MessageBounceModal;
var react_1 = require("react");
var Modal_1 = require("../Modal");
var context_1 = require("../../context");
function MessageBounceModal(_a) {
    var MessageBouncePrompt = _a.MessageBouncePrompt, modalProps = __rest(_a, ["MessageBouncePrompt"]);
    return (<Modal_1.Modal className='str-chat__message-bounce-modal' {...modalProps}>
      <context_1.MessageBounceProvider>
        <MessageBouncePrompt onClose={modalProps.onClose}/>
      </context_1.MessageBounceProvider>
    </Modal_1.Modal>);
}
