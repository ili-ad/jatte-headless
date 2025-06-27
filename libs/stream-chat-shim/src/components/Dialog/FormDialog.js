"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormDialog = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var FieldError_1 = require("../Form/FieldError");
var context_1 = require("../../context");
var FormDialog = function (_a) {
    var className = _a.className, close = _a.close, fields = _a.fields, onSubmit = _a.onSubmit, shouldDisableSubmitButton = _a.shouldDisableSubmitButton, title = _a.title;
    var t = (0, context_1.useTranslationContext)().t;
    var _b = (0, react_1.useState)({}), fieldErrors = _b[0], setFieldErrors = _b[1];
    var _c = (0, react_1.useState)(function () {
        var _a;
        var acc = {};
        for (var _i = 0, _b = Object.entries(fields); _i < _b.length; _i++) {
            var _c = _b[_i], id = _c[0], config = _c[1];
            acc = __assign(__assign({}, acc), (_a = {}, _a[id] = config.props.value, _a));
        }
        return acc;
    }), value = _c[0], setValue = _c[1];
    var handleChange = (0, react_1.useCallback)(function (event) {
        var _a;
        var fieldId = event.target.id;
        var fieldConfig = fields[fieldId];
        if (!fieldConfig)
            return;
        var error = (_a = fieldConfig.validator) === null || _a === void 0 ? void 0 : _a.call(fieldConfig, event.target.value);
        if (error) {
            setFieldErrors(function (prev) {
                var _a;
                return (__assign((_a = {}, _a[fieldId] = error, _a), prev));
            });
        }
        else {
            setFieldErrors(function (prev) {
                delete prev[fieldId];
                return prev;
            });
        }
        setValue(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[fieldId] = event.target.value, _a)));
        });
        if (!fieldConfig.props.onChange)
            return;
        if (fieldConfig.element === 'input') {
            fieldConfig.props.onChange(event);
        }
        else if (fieldConfig.element === 'textarea') {
            fieldConfig.props.onChange(event);
        }
    }, [fields]);
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var errors, _i, _a, _b, id, fieldValue, thisFieldError;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!Object.keys(value).length)
                        return [2 /*return*/];
                    errors = {};
                    for (_i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
                        _b = _a[_i], id = _b[0], fieldValue = _b[1];
                        thisFieldError = (_d = (_c = fields[id]).validator) === null || _d === void 0 ? void 0 : _d.call(_c, fieldValue);
                        if (thisFieldError) {
                            errors[id] = thisFieldError;
                        }
                    }
                    if (Object.keys(errors).length) {
                        setFieldErrors(errors);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, onSubmit(value)];
                case 1:
                    _e.sent();
                    close();
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className={(0, clsx_1.default)('str-chat__dialog str-chat__dialog--form', className)}>
      <div className='str-chat__dialog__body'>
        {title && <div className='str-chat__dialog__title'>{title}</div>}
        <form autoComplete='off' onSubmit={function (e) {
            e.preventDefault();
            handleSubmit();
        }}>
          {Object.entries(fields).map(function (_a) {
            var _b;
            var id = _a[0], fieldConfig = _a[1];
            return (<div className='str-chat__dialog__field' key={"dialog-field-".concat(id)}>
              {fieldConfig.label && (<label className={(0, clsx_1.default)("str-chat__dialog__title str-chat__dialog__title--".concat(id))} htmlFor={id}>
                  {fieldConfig.label}
                </label>)}
              {react_1.default.createElement(fieldConfig.element, __assign(__assign({ id: id }, fieldConfig.props), { onChange: handleChange, value: value[id] }))}
              <FieldError_1.FieldError text={(_b = fieldErrors[id]) === null || _b === void 0 ? void 0 : _b.message}/>
            </div>);
        })}
          <div className='str-chat__dialog__controls'>
            <button className='str-chat__dialog__controls-button str-chat__dialog__controls-button--cancel' onClick={close}>
              {t('Cancel')}
            </button>
            <button className='str-chat__dialog__controls-button str-chat__dialog__controls-button--submit' disabled={Object.keys(fieldErrors).length > 0 || (shouldDisableSubmitButton === null || shouldDisableSubmitButton === void 0 ? void 0 : shouldDisableSubmitButton(value))} type='submit'>
              {t('Send')}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
exports.FormDialog = FormDialog;
