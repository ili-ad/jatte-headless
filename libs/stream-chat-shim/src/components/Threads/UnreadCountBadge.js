"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreadCountBadge = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var UnreadCountBadge = function (_a) {
    var children = _a.children, count = _a.count, position = _a.position;
    return (<div className='str-chat__unread-count-badge-container'>
    {children}
    {count > 0 && (<div className={(0, clsx_1.default)('str-chat__unread-count-badge', position && "str-chat__unread-count-badge--".concat(position))}>
        {count}
      </div>)}
  </div>);
};
exports.UnreadCountBadge = UnreadCountBadge;
