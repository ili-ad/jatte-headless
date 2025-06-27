"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnterLeaveHandlers = void 0;
var react_1 = require("react");
var useEnterLeaveHandlers = function (_a) {
    var _b = _a === void 0 ? {} : _a, onMouseEnter = _b.onMouseEnter, onMouseLeave = _b.onMouseLeave;
    var _c = (0, react_1.useState)(false), tooltipVisible = _c[0], setTooltipVisible = _c[1];
    var handleEnter = (0, react_1.useCallback)(function (e) {
        setTooltipVisible(true);
        onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(e);
    }, [onMouseEnter]);
    var handleLeave = (0, react_1.useCallback)(function (e) {
        setTooltipVisible(false);
        onMouseLeave === null || onMouseLeave === void 0 ? void 0 : onMouseLeave(e);
    }, [onMouseLeave]);
    return { handleEnter: handleEnter, handleLeave: handleLeave, tooltipVisible: tooltipVisible };
};
exports.useEnterLeaveHandlers = useEnterLeaveHandlers;
