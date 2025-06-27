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
exports.useAudioController = exports.elementIsPlaying = void 0;
var lodash_throttle_1 = require("lodash.throttle");
var react_1 = require("react");
var context_1 = require("../../../context");
var isSeekable = function (audioElement) {
    return !(audioElement.duration === Infinity || isNaN(audioElement.duration));
};
var elementIsPlaying = function (audioElement) {
    return audioElement && !(audioElement.paused || audioElement.ended);
};
exports.elementIsPlaying = elementIsPlaying;
var logError = function (e) { return console.error('[AUDIO PLAYER]', e); };
var DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];
var useAudioController = function (_a) {
    var _b = _a === void 0 ? {} : _a, durationSeconds = _b.durationSeconds, mimeType = _b.mimeType, _c = _b.playbackRates, playbackRates = _c === void 0 ? DEFAULT_PLAYBACK_RATES : _c;
    var addNotification = (0, context_1.useChannelActionContext)('useAudioController').addNotification;
    var t = (0, context_1.useTranslationContext)('useAudioController').t;
    var _d = (0, react_1.useState)(false), isPlaying = _d[0], setIsPlaying = _d[1];
    var _e = (0, react_1.useState)(), playbackError = _e[0], setPlaybackError = _e[1];
    var _f = (0, react_1.useState)(true), canPlayRecord = _f[0], setCanPlayRecord = _f[1];
    var _g = (0, react_1.useState)(0), secondsElapsed = _g[0], setSecondsElapsed = _g[1];
    var _h = (0, react_1.useState)(0), playbackRateIndex = _h[0], setPlaybackRateIndex = _h[1];
    var playTimeout = (0, react_1.useRef)(undefined);
    var audioRef = (0, react_1.useRef)(null);
    var registerError = (0, react_1.useCallback)(function (e) {
        logError(e);
        setPlaybackError(e);
        addNotification(e.message, 'error');
    }, [addNotification]);
    var togglePlay = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!audioRef.current)
                        return [2 /*return*/];
                    clearTimeout(playTimeout.current);
                    playTimeout.current = undefined;
                    if (mimeType && !audioRef.current.canPlayType(mimeType)) {
                        registerError(new Error(t('Recording format is not supported and cannot be reproduced')));
                        setCanPlayRecord(false);
                        return [2 /*return*/];
                    }
                    if (!(0, exports.elementIsPlaying)(audioRef.current)) return [3 /*break*/, 1];
                    audioRef.current.pause();
                    setIsPlaying(false);
                    return [3 /*break*/, 6];
                case 1:
                    playTimeout.current = setTimeout(function () {
                        if (!audioRef.current)
                            return;
                        try {
                            audioRef.current.pause();
                            setIsPlaying(false);
                        }
                        catch (e) {
                            registerError(new Error(t('Failed to play the recording')));
                        }
                    }, 2000);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 6]);
                    return [4 /*yield*/, audioRef.current.play()];
                case 3:
                    _a.sent();
                    setIsPlaying(true);
                    return [3 /*break*/, 6];
                case 4:
                    e_1 = _a.sent();
                    registerError(e_1);
                    setIsPlaying(false);
                    return [3 /*break*/, 6];
                case 5:
                    clearTimeout(playTimeout.current);
                    playTimeout.current = undefined;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [mimeType, registerError, t]);
    var increasePlaybackRate = function () {
        setPlaybackRateIndex(function (prev) {
            if (!audioRef.current)
                return prev;
            var nextIndex = prev === playbackRates.length - 1 ? 0 : prev + 1;
            audioRef.current.playbackRate = playbackRates[nextIndex];
            return nextIndex;
        });
    };
    var seek = (0, react_1.useMemo)(function () {
        return (0, lodash_throttle_1.default)(function (_a) {
            var clientX = _a.clientX, currentTarget = _a.currentTarget;
            if (!(currentTarget && audioRef.current))
                return;
            if (!isSeekable(audioRef.current)) {
                registerError(new Error(t('Cannot seek in the recording')));
                return;
            }
            var _b = currentTarget.getBoundingClientRect(), width = _b.width, x = _b.x;
            var ratio = (clientX - x) / width;
            if (ratio > 1 || ratio < 0)
                return;
            var currentTime = ratio * audioRef.current.duration;
            setSecondsElapsed(currentTime);
            audioRef.current.currentTime = currentTime;
        }, 16);
    }, [registerError, t]);
    (0, react_1.useEffect)(function () {
        if (!audioRef.current)
            return;
        var audioElement = audioRef.current;
        var handleEnded = function () {
            var _a, _b;
            setSecondsElapsed((_b = (_a = audioElement === null || audioElement === void 0 ? void 0 : audioElement.duration) !== null && _a !== void 0 ? _a : durationSeconds) !== null && _b !== void 0 ? _b : 0);
            setIsPlaying(false);
        };
        audioElement.addEventListener('ended', handleEnded);
        var handleError = function () {
            addNotification(t('Error reproducing the recording'), 'error');
            setIsPlaying(false);
        };
        audioElement.addEventListener('error', handleError);
        var handleTimeupdate = function () {
            setSecondsElapsed(audioElement === null || audioElement === void 0 ? void 0 : audioElement.currentTime);
        };
        audioElement.addEventListener('timeupdate', handleTimeupdate);
        return function () {
            audioElement.pause();
            audioElement.removeEventListener('ended', handleEnded);
            audioElement.removeEventListener('error', handleError);
            audioElement.removeEventListener('timeupdate', handleTimeupdate);
        };
    }, [addNotification, durationSeconds, t]);
    return {
        audioRef: audioRef,
        canPlayRecord: canPlayRecord,
        increasePlaybackRate: increasePlaybackRate,
        isPlaying: isPlaying,
        playbackError: playbackError,
        playbackRate: playbackRates[playbackRateIndex],
        progress: audioRef.current && secondsElapsed
            ? (secondsElapsed / audioRef.current.duration) * 100
            : 0,
        secondsElapsed: secondsElapsed,
        seek: seek,
        togglePlay: togglePlay,
    };
};
exports.useAudioController = useAudioController;
