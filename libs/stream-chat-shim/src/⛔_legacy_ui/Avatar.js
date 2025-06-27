"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = void 0;
var react_1 = require("react");
/**
 * Minimal avatar component used as placeholder for Stream UI.
 */
var Avatar = function (_a) {
    var _b;
    var className = _a.className, image = _a.image, name = _a.name, onClick = _a.onClick, onMouseOver = _a.onMouseOver;
    var initial = (_b = name === null || name === void 0 ? void 0 : name.charAt(0)) !== null && _b !== void 0 ? _b : '';
    return (<div className={className} data-testid="avatar" onClick={onClick} onMouseOver={onMouseOver}>
      {image ? <img src={image} alt={initial}/> : initial}
    </div>);
};
exports.Avatar = Avatar;
