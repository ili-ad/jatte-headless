"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventComponent = void 0;
var react_1 = require("react");
/** Placeholder implementation of the EventComponent. */
var EventComponent = function (_a) {
    var _b;
    var message = _a.message;
    return (<div data-testid="event-component-placeholder">
      {(_b = message === null || message === void 0 ? void 0 : message.text) !== null && _b !== void 0 ? _b : 'Event'}
    </div>);
};
exports.EventComponent = EventComponent;
exports.default = exports.EventComponent;
