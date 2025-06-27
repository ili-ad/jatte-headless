"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupAvatar = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var Avatar_1 = require("./Avatar");
var GroupAvatar = function (_a) {
    var className = _a.className, groupChannelDisplayInfo = _a.groupChannelDisplayInfo, onClick = _a.onClick, onMouseOver = _a.onMouseOver;
    return (<div className={(0, clsx_1.default)("str-chat__avatar-group", { 'str-chat__avatar-group--three-part': groupChannelDisplayInfo.length === 3 }, className)} data-testid='group-avatar' onClick={onClick} onMouseOver={onMouseOver} role='button'>
    {groupChannelDisplayInfo.slice(0, 4).map(function (_a, i) {
            var image = _a.image, name = _a.name;
            return (<Avatar_1.Avatar className={(0, clsx_1.default)({
                    'str-chat__avatar--single': groupChannelDisplayInfo.length === 3 && i === 0,
                })} image={image} key={"".concat(name, "-").concat(image, "-").concat(i)} name={name}/>);
        })}
  </div>);
};
exports.GroupAvatar = GroupAvatar;
