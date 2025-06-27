"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTranslationTopic = exports.defaultNotificationTranslators = void 0;
exports.defaultNotificationTranslators = {};
/**
 * Placeholder implementation of Stream\'s NotificationTranslationTopic class.
 */
var NotificationTranslationTopic = /** @class */ (function () {
    function NotificationTranslationTopic(_a) {
        var i18next = _a.i18next, translators = _a.translators;
        var _this = this;
        this.translators = new Map();
        this.i18next = i18next;
        Object.entries(exports.defaultNotificationTranslators).forEach(function (_a) {
            var name = _a[0], tr = _a[1];
            _this.translators.set(name, tr);
        });
        if (translators) {
            Object.entries(translators).forEach(function (_a) {
                var name = _a[0], translator = _a[1];
                _this.translators.set(name, translator);
            });
        }
    }
    NotificationTranslationTopic.prototype.translate = function (value, _key, _options) {
        // Placeholder: simply return the provided string
        return value;
    };
    NotificationTranslationTopic.prototype.setTranslator = function (name, translator) {
        this.translators.set(name, translator);
    };
    NotificationTranslationTopic.prototype.removeTranslator = function (name) {
        this.translators.delete(name);
    };
    return NotificationTranslationTopic;
}());
exports.NotificationTranslationTopic = NotificationTranslationTopic;
exports.default = NotificationTranslationTopic;
