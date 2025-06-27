"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmoticonItem = void 0;
var react_1 = require("react");
var EmoticonItem = function (props) {
    var _a;
    var entity = props.entity;
    var hasEntity = Object.keys(entity).length;
    if (!hasEntity)
        return null;
    var _b = (_a = entity.tokenizedDisplayName) !== null && _a !== void 0 ? _a : {}, parts = _b.parts, token = _b.token;
    var renderName = function () {
        var _a;
        return (_a = parts === null || parts === void 0 ? void 0 : parts.map(function (part, i) {
            return part.toLowerCase() === token ? (<span className='str-chat__emoji-item--highlight' key={"part-".concat(i)}>
          {part}
        </span>) : (<span className='str-chat__emoji-item--part' key={"part-".concat(i)}>
          {part}
        </span>);
        })) !== null && _a !== void 0 ? _a : null;
    };
    return (<div className='str-chat__emoji-item'>
      <span className='str-chat__emoji-item--entity'>{entity.native}</span>
      <span className='str-chat__emoji-item--name'>{renderName()}</span>
    </div>);
};
exports.EmoticonItem = EmoticonItem;
