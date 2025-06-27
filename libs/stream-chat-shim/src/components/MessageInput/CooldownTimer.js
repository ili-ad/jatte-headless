"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CooldownTimer = void 0;
var react_1 = require("react");
var useTimer_1 = require("./hooks/useTimer");
var CooldownTimer = function (_a) {
    var cooldownInterval = _a.cooldownInterval;
    var secondsLeft = (0, useTimer_1.useTimer)({ startFrom: cooldownInterval });
    return (<div className='str-chat__message-input-cooldown' data-testid='cooldown-timer'>
      {secondsLeft}
    </div>);
};
exports.CooldownTimer = CooldownTimer;
