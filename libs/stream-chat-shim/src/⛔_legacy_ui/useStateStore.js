"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStateStore = useStateStore;
var react_1 = require("react");
/**
 * React hook that subscribes to a StateStore and returns a selected value.
 *
 * This is a lightweight implementation mirroring the behaviour of
 * Stream Chat's `useStateStore` helper.
 *
 * @param store - State store or compatible object providing `subscribe` and
 *   `getLatestValue` or `getSnapshot`.
 * @param selector - Function used to select a slice of the state.
 * @returns Selected value from the store or undefined when the store is missing.
 */
function useStateStore(store, selector) {
    var _a, _b;
    if (selector === void 0) { selector = function (v) { return v; }; }
    if (!store || typeof store.subscribe !== 'function')
        return undefined;
    var getter = (_b = (_a = store.getLatestValue) !== null && _a !== void 0 ? _a : store.getSnapshot) !== null && _b !== void 0 ? _b : (function () { return undefined; });
    return (0, react_1.useSyncExternalStore)(store.subscribe.bind(store), function () { return selector(getter()); }, function () { return selector(getter()); });
}
exports.default = useStateStore;
