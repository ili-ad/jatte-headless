"use strict";
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
exports.MediaRecordingState = void 0;
exports.useMediaRecorder = useMediaRecorder;
var react_1 = require("react");
/** Placeholder enum mirroring Stream's `MediaRecordingState`. */
var MediaRecordingState;
(function (MediaRecordingState) {
    MediaRecordingState["PAUSED"] = "paused";
    MediaRecordingState["RECORDING"] = "recording";
    MediaRecordingState["STOPPED"] = "stopped";
})(MediaRecordingState || (exports.MediaRecordingState = MediaRecordingState = {}));
/** Minimal stub of Stream's MediaRecorderController. */
var PlaceholderMediaRecorderController = /** @class */ (function () {
    function PlaceholderMediaRecorderController() {
        this.permission = {
            state: {
                subscribe: function (_) { return ({ unsubscribe: function () { } }); },
            },
            watch: function () { },
            unwatch: function () { },
        };
        this.recording = { subscribe: function (_) { return ({ unsubscribe: function () { } }); } };
        this.recordingState = { subscribe: function (_) { return ({ unsubscribe: function () { } }); } };
    }
    PlaceholderMediaRecorderController.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    PlaceholderMediaRecorderController.prototype.cancel = function () { };
    PlaceholderMediaRecorderController.prototype.cleanUp = function () { };
    return PlaceholderMediaRecorderController;
}());
/**
 * Placeholder implementation of Stream's `useMediaRecorder` hook.
 * It exposes the same API shape but performs no real media recording.
 */
function useMediaRecorder(_a) {
    var asyncMessagesMultiSendEnabled = _a.asyncMessagesMultiSendEnabled, enabled = _a.enabled, generateRecordingTitle = _a.generateRecordingTitle, handleSubmit = _a.handleSubmit, recordingConfig = _a.recordingConfig;
    void asyncMessagesMultiSendEnabled;
    void generateRecordingTitle;
    void handleSubmit;
    void recordingConfig;
    var _b = (0, react_1.useState)(), recording = _b[0], setRecording = _b[1];
    var _c = (0, react_1.useState)(), recordingState = _c[0], setRecordingState = _c[1];
    var _d = (0, react_1.useState)(), permissionState = _d[0], setPermissionState = _d[1];
    var recorder = (0, react_1.useMemo)(function () { return (enabled ? new PlaceholderMediaRecorderController() : undefined); }, [enabled]);
    var completeRecording = (0, react_1.useCallback)(function () {
        throw new Error('useMediaRecorder not implemented');
    }, []);
    (0, react_1.useEffect)(function () {
        if (!recorder)
            return;
        recorder.permission.watch();
        var recordingSub = recorder.recording.subscribe(setRecording);
        var stateSub = recorder.recordingState.subscribe(setRecordingState);
        var permSub = recorder.permission.state.subscribe(setPermissionState);
        return function () {
            recorder.cancel();
            recorder.permission.unwatch();
            recordingSub.unsubscribe();
            stateSub.unsubscribe();
            permSub.unsubscribe();
        };
    }, [recorder]);
    return {
        completeRecording: completeRecording,
        permissionState: permissionState,
        recorder: recorder,
        recording: recording,
        recordingState: recordingState,
    };
}
exports.default = useMediaRecorder;
