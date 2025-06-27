"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelPreviewInfo = void 0;
var react_1 = require("react");
var getDisplayTitle = function (channel, currentUser) {
    var _a, _b;
    var title = (_a = channel.data) === null || _a === void 0 ? void 0 : _a.name;
    var members = Object.values(channel.state.members);
    if (!title && members.length === 2) {
        var otherMember = members.find(function (m) { var _a; return ((_a = m.user) === null || _a === void 0 ? void 0 : _a.id) !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id); });
        if (otherMember && ((_b = otherMember.user) === null || _b === void 0 ? void 0 : _b.name)) {
            title = otherMember.user.name;
        }
    }
    return title;
};
var getDisplayImage = function (channel, currentUser) {
    var _a, _b;
    var image = (_a = channel.data) === null || _a === void 0 ? void 0 : _a.image;
    var members = Object.values(channel.state.members);
    if (!image && members.length === 2) {
        var otherMember = members.find(function (m) { var _a; return ((_a = m.user) === null || _a === void 0 ? void 0 : _a.id) !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id); });
        if (otherMember && ((_b = otherMember.user) === null || _b === void 0 ? void 0 : _b.image)) {
            image = otherMember.user.image;
        }
    }
    return image;
};
/**
 * Lightweight replacement for Stream's `useChannelPreviewInfo` hook.
 */
var useChannelPreviewInfo = function (props) {
    var channel = props.channel, overrideImage = props.overrideImage, overrideTitle = props.overrideTitle;
    var client = channel.client;
    var user = client === null || client === void 0 ? void 0 : client.user;
    var _a = (0, react_1.useState)(function () { return getDisplayTitle(channel, user); }), displayTitle = _a[0], setDisplayTitle = _a[1];
    var _b = (0, react_1.useState)(function () { return getDisplayImage(channel, user); }), displayImage = _b[0], setDisplayImage = _b[1];
    (0, react_1.useEffect)(function () {
        if (!client)
            return;
        var handleEvent = function () {
            setDisplayTitle(function (prev) {
                var newTitle = getDisplayTitle(channel, client.user);
                return prev !== newTitle ? newTitle : prev;
            });
            setDisplayImage(function (prev) {
                var newImage = getDisplayImage(channel, client.user);
                return prev !== newImage ? newImage : prev;
            });
        };
        client.on('user.updated', handleEvent);
        return function () {
            client.off('user.updated', handleEvent);
        };
    }, [channel, client]);
    return {
        displayImage: overrideImage || displayImage,
        displayTitle: overrideTitle || displayTitle,
    };
};
exports.useChannelPreviewInfo = useChannelPreviewInfo;
