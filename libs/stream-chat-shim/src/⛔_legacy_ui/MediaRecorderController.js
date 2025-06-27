"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaRecorderController = exports.RecordingAttachmentType = exports.MediaRecordingState = void 0;
var MediaRecordingState;
(function (MediaRecordingState) {
    MediaRecordingState["PAUSED"] = "paused";
    MediaRecordingState["RECORDING"] = "recording";
    MediaRecordingState["STOPPED"] = "stopped";
})(MediaRecordingState || (exports.MediaRecordingState = MediaRecordingState = {}));
var RecordingAttachmentType;
(function (RecordingAttachmentType) {
    RecordingAttachmentType["VOICE_RECORDING"] = "voiceRecording";
})(RecordingAttachmentType || (exports.RecordingAttachmentType = RecordingAttachmentType = {}));
var SimpleSubscription = /** @class */ (function () {
    function SimpleSubscription(onUnsub) {
        this.onUnsub = onUnsub;
        this.closed = false;
    }
    SimpleSubscription.prototype.unsubscribe = function () {
        var _a;
        this.closed = true;
        (_a = this.onUnsub) === null || _a === void 0 ? void 0 : _a.call(this);
    };
    return SimpleSubscription;
}());
var SimpleSubject = /** @class */ (function () {
    function SimpleSubject(value) {
        this.value = value;
    }
    SimpleSubject.prototype.next = function (value) { this.value = value; };
    SimpleSubject.prototype.subscribe = function (_listener) { return new SimpleSubscription(); };
    return SimpleSubject;
}());
var BehaviorSubject = /** @class */ (function (_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BehaviorSubject;
}(SimpleSubject));
var Subject = /** @class */ (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Subject;
}(SimpleSubject));
var BrowserPermission = /** @class */ (function () {
    function BrowserPermission() {
        this.state = new BehaviorSubject(undefined);
    }
    BrowserPermission.prototype.watch = function () { };
    BrowserPermission.prototype.unwatch = function () { };
    BrowserPermission.prototype.check = function () { };
    return BrowserPermission;
}());
/**
 * Placeholder implementation of the MediaRecorderController class used by Stream UI.
 * This shim exposes the public interface without providing recording behaviour.
 */
var MediaRecorderController = /** @class */ (function () {
    function MediaRecorderController(_opts) {
        if (_opts === void 0) { _opts = {}; }
        this.recordingState = new BehaviorSubject(undefined);
        this.recording = new BehaviorSubject(undefined);
        this.error = new Subject();
        this.notification = new Subject();
        this.permission = new BrowserPermission();
    }
    Object.defineProperty(MediaRecorderController.prototype, "durationMs", {
        get: function () {
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    MediaRecorderController.prototype.start = function () {
        throw new Error('MediaRecorderController.start not implemented');
    };
    MediaRecorderController.prototype.pause = function () { };
    MediaRecorderController.prototype.resume = function () { };
    MediaRecorderController.prototype.stop = function () {
        return Promise.resolve(undefined);
    };
    MediaRecorderController.prototype.cancel = function () { };
    MediaRecorderController.prototype.cleanUp = function () { };
    return MediaRecorderController;
}());
exports.MediaRecorderController = MediaRecorderController;
exports.default = MediaRecorderController;
