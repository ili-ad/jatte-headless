"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingIndicator = void 0;
var react_1 = require("react");
var LoadingIndicator = function (_a) {
    var backgroundColor = _a.backgroundColor, color = _a.color, _b = _a.size, size = _b === void 0 ? 20 : _b, _c = _a.width, width = _c === void 0 ? 2 : _c;
    return (<div className='rfu-loading-indicator__spinner' style={{
            borderColor: backgroundColor ? backgroundColor : '',
            borderTopColor: color ? color : '',
            borderWidth: width ? width : '',
            height: size ? size : '',
            margin: '0 auto',
            width: size ? size : '',
        }}/>);
};
exports.LoadingIndicator = LoadingIndicator;
