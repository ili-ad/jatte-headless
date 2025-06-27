"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionList = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var DefaultPollOptionSelector = function (_props) { return null; };
var useStateStore = function (_store, _selector) { return ({ options: [] }); };
var useComponentContext = function () { return ({ PollOptionSelector: DefaultPollOptionSelector }); };
var usePollContext = function () { return ({ poll: { state: {} } }); };
var pollStateSelector = function (nextValue) { return ({
    options: nextValue.options,
}); };
var PollOptionList = function (_a) {
    var optionsDisplayCount = _a.optionsDisplayCount;
    var _b = useComponentContext().PollOptionSelector, PollOptionSelector = _b === void 0 ? DefaultPollOptionSelector : _b;
    var poll = usePollContext().poll;
    var options = useStateStore(poll.state, pollStateSelector).options;
    return (<div className={(0, clsx_1.default)('str-chat__poll-option-list', {
            'str-chat__poll-option-list--full': typeof optionsDisplayCount === 'undefined',
        })}>
      {options.slice(0, optionsDisplayCount !== null && optionsDisplayCount !== void 0 ? optionsDisplayCount : options.length).map(function (option) { return (<PollOptionSelector displayAvatarCount={3} key={"poll-option-".concat(option.id)} option={option}/>); })}
    </div>);
};
exports.PollOptionList = PollOptionList;
exports.default = exports.PollOptionList;
