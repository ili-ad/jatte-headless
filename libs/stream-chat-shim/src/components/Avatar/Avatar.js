"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var icons_1 = require("../Threads/icons");
var utils_1 = require("../../utils");
/**
 * A round avatar image with fallback to username's first letter
 */
var Avatar = function (props) {
    var _a;
    var className = props.className, image = props.image, name = props.name, _b = props.onClick, onClick = _b === void 0 ? function () { return undefined; } : _b, _c = props.onMouseOver, onMouseOver = _c === void 0 ? function () { return undefined; } : _c;
    var _d = (0, react_1.useState)(false), error = _d[0], setError = _d[1];
    (0, react_1.useEffect)(function () {
        setError(false);
    }, [image]);
    var nameStr = (name === null || name === void 0 ? void 0 : name.toString()) || '';
    var initials = (0, utils_1.getWholeChar)(nameStr, 0);
    var showImage = image && !error;
    return (<div className={(0, clsx_1.default)("str-chat__avatar str-chat__message-sender-avatar", className, (_a = {},
            _a['str-chat__avatar--multiple-letters'] = initials.length > 1,
            _a['str-chat__avatar--no-letters'] = !initials.length,
            _a['str-chat__avatar--one-letter'] = initials.length === 1,
            _a))} data-testid='avatar' onClick={onClick} onMouseOver={onMouseOver} role='button' title={name}>
      {showImage ? (<img alt={initials} className='str-chat__avatar-image' data-testid='avatar-img' onError={function () { return setError(true); }} src={image}/>) : (<>
          {!!initials.length && (<div className={(0, clsx_1.default)('str-chat__avatar-fallback')} data-testid='avatar-fallback'>
              {initials}
            </div>)}
          {!initials.length && <icons_1.Icon.User />}
        </>)}
    </div>);
};
exports.Avatar = Avatar;
