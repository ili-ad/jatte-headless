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
exports.Streami18n = void 0;
/**
 * Very small placeholder for the real Streami18n class used by Stream UI.
 * It stores translations and exposes `t` and `tDateTimeParser` helpers.
 */
var Streami18n = /** @class */ (function () {
    function Streami18n(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var _a, _b;
        this.translations = {};
        this.setLanguageCallback = function () { };
        /** Translator function */
        this.t = function (key) { var _a, _b; return (_b = (_a = _this.translations[_this.currentLanguage]) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : key; };
        /** Basic datetime parser using the built in Date constructor. */
        this.tDateTimeParser = function (value) { return new Date(value); };
        this.currentLanguage = (_a = options.language) !== null && _a !== void 0 ? _a : 'en';
        this.logger = (_b = options.logger) !== null && _b !== void 0 ? _b : (function () { });
        if (options.translationsForLanguage) {
            this.translations[this.currentLanguage] = __assign({}, options.translationsForLanguage);
        }
    }
    /** Returns an instance of i18next in the real implementation. */
    Streami18n.prototype.geti18Instance = function () {
        return undefined;
    };
    /** Returns list of available languages. */
    Streami18n.prototype.getAvailableLanguages = function () {
        return Object.keys(this.translations);
    };
    /** Returns all registered translations. */
    Streami18n.prototype.getTranslations = function () {
        return this.translations;
    };
    /** Returns translator helpers, initializing if necessary. */
    Streami18n.prototype.getTranslators = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { t: this.t, tDateTimeParser: this.tDateTimeParser }];
            });
        });
    };
    /** Register translations for an additional language. */
    Streami18n.prototype.registerTranslation = function (language, translation) {
        this.translations[language] = __assign({}, translation);
    };
    /** Update or add locale information – no-op in shim. */
    Streami18n.prototype.addOrUpdateLocale = function (_key, _config) { };
    /** Change the active language. */
    Streami18n.prototype.setLanguage = function (language) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.currentLanguage = language;
                this.setLanguageCallback(this.t);
                return [2 /*return*/, this.t];
            });
        });
    };
    /** Register callback invoked when language changes. */
    Streami18n.prototype.registerSetLanguageCallback = function (callback) {
        this.setLanguageCallback = callback;
    };
    return Streami18n;
}());
exports.Streami18n = Streami18n;
exports.default = Streami18n;
