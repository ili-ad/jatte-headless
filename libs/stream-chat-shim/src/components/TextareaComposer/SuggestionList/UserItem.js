"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserItem = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var Avatar_1 = require("../../Avatar");
/**
 * UI component for mentions rendered in suggestion list
 */
var UserItem = function (_a) {
    var _b = _a.Avatar, Avatar = _b === void 0 ? Avatar_1.Avatar : _b, entity = _a.entity;
    var hasEntity = !!Object.keys(entity).length;
    if (!hasEntity)
        return null;
    var _c = entity.tokenizedDisplayName, parts = _c.parts, token = _c.token;
    var renderName = function () {
        return parts.map(function (part, i) {
            var matches = part.toLowerCase() === token;
            var partWithHTMLSpacesAround = part.replace(/^\s+|\s+$/g, '\u00A0');
            return (<span className={(0, clsx_1.default)({
                    'str-chat__emoji-item--highlight': matches,
                    'str-chat__emoji-item--part': !matches,
                })} key={"part-".concat(i)}>
          {partWithHTMLSpacesAround}
        </span>);
        });
    };
    return (<div className='str-chat__user-item'>
      <Avatar className='str-chat__avatar--autocomplete-item' image={entity.image} name={entity.name || entity.id}/>
      <span className='str-chat__user-item--name' data-testid={'user-item-name'}>
        {renderName()}
      </span>
      <div className='str-chat__user-item-at'>@</div>
    </div>);
};
exports.UserItem = UserItem;
