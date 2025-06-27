"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelAvatar = void 0;
var react_1 = require("react");
var _1 = require("./");
var ChannelAvatar = function (_a) {
    var groupChannelDisplayInfo = _a.groupChannelDisplayInfo, image = _a.image, name = _a.name, user = _a.user, sharedProps = __rest(_a, ["groupChannelDisplayInfo", "image", "name", "user"]);
    if (groupChannelDisplayInfo) {
        return (<_1.GroupAvatar groupChannelDisplayInfo={groupChannelDisplayInfo} {...sharedProps}/>);
    }
    return <_1.Avatar image={image} name={name} user={user} {...sharedProps}/>;
};
exports.ChannelAvatar = ChannelAvatar;
