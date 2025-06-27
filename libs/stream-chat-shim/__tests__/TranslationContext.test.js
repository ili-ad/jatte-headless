"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var TranslationContext_1 = require("../src/TranslationContext");
test('provides translation context', function () {
    var value = {
        t: function (key) { return "translated-".concat(key); },
        tDateTimeParser: function (input) { return new Date(input); },
        userLanguage: 'en',
    };
    var context;
    var Consumer = function () {
        context = (0, TranslationContext_1.useTranslationContext)();
        return null;
    };
    (0, server_1.renderToStaticMarkup)(<TranslationContext_1.TranslationProvider value={value}>
      <Consumer />
    </TranslationContext_1.TranslationProvider>);
    expect(context).toEqual(value);
});
