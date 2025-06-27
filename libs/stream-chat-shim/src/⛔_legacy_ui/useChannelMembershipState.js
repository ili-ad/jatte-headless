"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelMembershipState = void 0;
var react_1 = require("react");
/**
 * Placeholder hook for Stream's `useChannelMembershipState`.
 *
 * Keeps track of channel membership data. The real implementation
 * should listen to membership events on the channel and update state
 * accordingly.
 */
var useChannelMembershipState = function (channel) {
    var _a = (0, react_1.useState)({}), members = _a[0], setMembers = _a[1];
    (0, react_1.useEffect)(function () {
        // TODO: subscribe to channel membership events and update state
        setMembers({});
    }, [channel]);
    return { members: members };
};
exports.useChannelMembershipState = useChannelMembershipState;
