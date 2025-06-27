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
exports.SimpleSwitchField = exports.SwitchField = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
var SwitchField = function (_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    var inputRef = (0, react_1.useRef)(null);
    var handleKeyUp = function (event) {
        if (![' ', 'Enter'].includes(event.key) || !inputRef.current)
            return;
        event.preventDefault();
        inputRef.current.click();
    };
    return (<div className='str-chat__form__field str-chat__form__switch-field'>
      <label>
        <div className='str-chat__form__field str-chat__form__switch-field-content'>
          {children}
        </div>
        <input type='checkbox' {...props} ref={inputRef}/>
        <div className={(0, clsx_1.default)('str-chat__form__switch-field__switch', {
            'str-chat__form__switch-field__switch--on': props.checked,
        })} onKeyUp={handleKeyUp} tabIndex={0}>
          <div className='str-chat__form__switch-field__switch-handle'/>
        </div>
      </label>
    </div>);
};
exports.SwitchField = SwitchField;
var SimpleSwitchField = function (_a) {
    var labelText = _a.labelText, props = __rest(_a, ["labelText"]);
    return (<exports.SwitchField {...props}>
    <div className='str-chat__form__field str-chat__form__switch-field__text'>
      {labelText}
    </div>
  </exports.SwitchField>);
};
exports.SimpleSwitchField = SimpleSwitchField;
