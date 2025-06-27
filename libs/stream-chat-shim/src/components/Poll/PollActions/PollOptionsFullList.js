"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionsFullList = void 0;
var react_1 = require("react");
var ModalHeader_1 = require("../../Modal/ModalHeader");
var PollOptionList_1 = require("../PollOptionList");
var store_1 = require("../../../store");
var context_1 = require("../../../context");
var pollStateSelector = function (nextValue) { return ({
    name: nextValue.name,
}); };
var PollOptionsFullList = function (_a) {
    var close = _a.close;
    var t = (0, context_1.useTranslationContext)().t;
    var poll = (0, context_1.usePollContext)().poll;
    var name = (0, store_1.useStateStore)(poll.state, pollStateSelector).name;
    return (<div className="str-chat__modal__poll-option-list">
      <ModalHeader_1.ModalHeader close={close} title={t('Poll options')}/>
      <div className="str-chat__modal__poll-option-list__body">
        <div className="str-chat__modal__poll-option-list__title">{name}</div>
        <PollOptionList_1.PollOptionList />
      </div>
    </div>);
};
exports.PollOptionsFullList = PollOptionsFullList;
exports.default = exports.PollOptionsFullList;
