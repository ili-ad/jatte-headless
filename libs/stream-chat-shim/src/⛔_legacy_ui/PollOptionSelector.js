"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionSelector = exports.Checkmark = exports.AmountBar = void 0;
var react_1 = require("react");
/** Placeholder component mimicking the real AmountBar. */
var AmountBar = function (_a) {
    var amount = _a.amount, className = _a.className;
    return (<div className={className} data-testid="amount-bar" role="progressbar" style={{ width: "".concat(amount, "%") }}/>);
};
exports.AmountBar = AmountBar;
/** Placeholder component mimicking the real Checkmark. */
var Checkmark = function (_a) {
    var checked = _a.checked;
    return (<div data-testid="checkmark" className={checked ? 'checked' : undefined}/>);
};
exports.Checkmark = Checkmark;
/** Placeholder implementation of Stream's `PollOptionSelector` component. */
var PollOptionSelector = function (_props) { return (<div data-testid="poll-option-selector-placeholder"/>); };
exports.PollOptionSelector = PollOptionSelector;
exports.default = exports.PollOptionSelector;
