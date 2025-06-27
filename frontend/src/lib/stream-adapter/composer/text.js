"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTextComposer = void 0;
/* composer/text.ts */
var MiniStore_1 = require("../MiniStore");
var buildTextComposer = function () {
    var store = new MiniStore_1.MiniStore({
        text: '', selection: { start: 0, end: 0 },
        suggestions: { searchSource: { state: new MiniStore_1.MiniStore({ isLoadingItems: false }) } },
    });
    return {
        state: store,
        setText: function (t) { return store._set({ text: t }); },
        setSelection: function (s) { return store._set({ selection: s }); },
        clear: function () { return store._set({ text: '' }); },
        /* key handlers wired later by Channel.ts */
    };
};
exports.buildTextComposer = buildTextComposer;
