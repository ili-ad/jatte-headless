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
exports.BaseImage = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var DownloadButton = function (props) { return null; }; // temporary shim
exports.BaseImage = (0, react_1.forwardRef)(function BaseImage(_a, ref) {
    var props = __rest(_a, []);
    var propsClassName = props.className, propsOnError = props.onError;
    var _b = (0, react_1.useState)(false), error = _b[0], setError = _b[1];
    (0, react_1.useEffect)(function () { return function () {
        setError(false);
    }; }, [props.src]);
    return (<>
      <img data-testid='str-chat__base-image' {...props} className={(0, clsx_1.default)(propsClassName, 'str-chat__base-image', {
            'str-chat__base-image--load-failed': error,
        })} onError={function (e) {
            setError(true);
            propsOnError === null || propsOnError === void 0 ? void 0 : propsOnError(e);
        }} ref={ref}/>
      {error && <DownloadButton assetUrl={props.src}/>}
    </>);
});
