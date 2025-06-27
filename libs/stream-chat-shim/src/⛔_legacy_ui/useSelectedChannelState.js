"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelectedChannelState = useSelectedChannelState;
var react_1 = require("react");
var shim_1 = require("use-sync-external-store/shim");
// eslint-disable-next-line @typescript-eslint/no-empty-function
var noop = function () { };
function useSelectedChannelState(_a) {
    var channel = _a.channel, selector = _a.selector, _b = _a.stateChangeEventKeys, stateChangeEventKeys = _b === void 0 ? ['all'] : _b;
    var subscribe = (0, react_1.useCallback)(function (onStoreChange) {
        if (!channel)
            return noop;
        var subscriptions = stateChangeEventKeys.map(function (et) {
            return channel.on(et, function () {
                onStoreChange(selector(channel));
            });
        });
        return function () { return subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); }); };
    }, [channel, selector, stateChangeEventKeys]);
    var getSnapshot = (0, react_1.useCallback)(function () {
        if (!channel)
            return undefined;
        return selector(channel);
    }, [channel, selector]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
}
