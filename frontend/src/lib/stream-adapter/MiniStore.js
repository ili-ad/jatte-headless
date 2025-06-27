"use strict";
//frontend/src/lib/stream-adapter/MiniStore.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniStore = void 0;
/* ------------------------------------------------------------------ */
/* Really tiny drop-in for Stream’s StateStore                         */
/* ------------------------------------------------------------------ */
var MiniStore = /** @class */ (function () {
    function MiniStore(initial) {
        var _this = this;
        this.listeners = new Set();
        /* ---- APIs the React useSyncExternalStore hook relies on ---- */
        this.getSnapshot = function () { return _this._state; };
        this.getServerSnapshot = function () { return _this._state; };
        /** Stream-UI sometimes calls this alias directly */
        this.getLatestValue = function () { return _this._state; };
        /* ---- subscribe helpers ---- */
        this.subscribe = function (cb) {
            _this.listeners.add(cb);
            return function () { return _this.listeners.delete(cb); };
        };
        /**
         * Stream-UI’s preferred helper: it lets the caller supply a selector
         * so the callback fires *only* when that slice changes.
         */
        this.subscribeWithSelector = function (selector, cb) {
            var prev = selector(_this._state);
            return _this.subscribe(function () {
                var next = selector(_this._state);
                if (next !== prev) {
                    prev = next;
                    cb();
                }
            });
        };
        /* ---- internal setter ---- */
        this._set = function (patch) {
            _this._state = __assign(__assign({}, _this._state), patch);
            _this.listeners.forEach(function (l) { return l(); });
        };
        /** RxJS-compat – Stream-UI calls store.next(partial) */
        this.next = this._set; // ← 🆕 one-liner    
        this._state = initial;
    }
    return MiniStore;
}());
exports.MiniStore = MiniStore;
