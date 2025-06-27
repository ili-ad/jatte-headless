"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTimer = void 0;
var react_1 = require("react");
var useTimer = function (_a) {
    var startFrom = _a.startFrom;
    var _b = (0, react_1.useState)(), secondsLeft = _b[0], setSecondsLeft = _b[1];
    (0, react_1.useEffect)(function () {
        var countdownTimeout;
        if (typeof secondsLeft === 'number' && secondsLeft > 0) {
            countdownTimeout = setTimeout(function () {
                setSecondsLeft(secondsLeft - 1);
            }, 1000);
        }
        return function () {
            clearTimeout(countdownTimeout);
        };
    }, [secondsLeft]);
    (0, react_1.useEffect)(function () {
        setSecondsLeft(startFrom !== null && startFrom !== void 0 ? startFrom : 0);
    }, [startFrom]);
    return secondsLeft;
};
exports.useTimer = useTimer;
