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
exports.FileIcon = void 0;
exports.mimeTypeToIcon = mimeTypeToIcon;
var react_1 = require("react");
var iconMap_1 = require("./iconMap");
function mimeTypeToIcon(type, mimeType) {
    if (type === void 0) { type = 'standard'; }
    var theMap = iconMap_1.iconMap[type] || iconMap_1.iconMap['standard'];
    if (!mimeType)
        return theMap.fallback;
    var icon = theMap[mimeType];
    if (icon)
        return icon;
    if (mimeType.startsWith('audio/'))
        return theMap['audio/'];
    if (mimeType.startsWith('video/'))
        return theMap['video/'];
    if (mimeType.startsWith('image/'))
        return theMap['image/'];
    if (mimeType.startsWith('text/'))
        return theMap['text/'];
    return theMap.fallback;
}
var FileIcon = function (props) {
    var _a = props.big, big = _a === void 0 ? false : _a, mimeType = props.mimeType, _b = props.size, size = _b === void 0 ? 50 : _b, _c = props.sizeSmall, sizeSmall = _c === void 0 ? 20 : _c, _d = props.type, type = _d === void 0 ? 'standard' : _d, rest = __rest(props, ["big", "mimeType", "size", "sizeSmall", "type"]);
    var Icon = mimeTypeToIcon(type, mimeType);
    return <Icon {...rest} size={big ? size : sizeSmall}/>;
};
exports.FileIcon = FileIcon;
