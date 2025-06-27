"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTimeElapsed = void 0;
var react_1 = require("react");
// todo: provide start timestamp
var useTimeElapsed = function (_a) {
    var _b = _a === void 0 ? {} : _a, startOnMount = _b.startOnMount;
    var _c = (0, react_1.useState)(0), secondsElapsed = _c[0], setSecondsElapsed = _c[1];
    var updateInterval = (0, react_1.useRef)(undefined);
    var startCounter = (0, react_1.useCallback)(function () {
        if (updateInterval.current)
            return;
        updateInterval.current = setInterval(function () {
            setSecondsElapsed(function (prev) { return prev + 1; });
        }, 1000);
    }, []);
    var stopCounter = (0, react_1.useCallback)(function () {
        clearInterval(updateInterval.current);
        updateInterval.current = undefined;
    }, []);
    (0, react_1.useEffect)(function () {
        if (!startOnMount)
            return;
        startCounter();
        return function () {
            stopCounter();
        };
    }, [startCounter, startOnMount, stopCounter]);
    return {
        secondsElapsed: secondsElapsed,
        startCounter: startCounter,
        stopCounter: stopCounter,
    };
};
exports.useTimeElapsed = useTimeElapsed;
