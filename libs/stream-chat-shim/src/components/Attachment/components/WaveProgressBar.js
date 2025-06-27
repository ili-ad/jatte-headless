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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveProgressBar = void 0;
var lodash_throttle_1 = require("lodash.throttle");
var react_1 = require("react");
var clsx_1 = require("clsx");
var audioSampling_1 = require("../audioSampling");
var WaveProgressBar = function (_a) {
    var _b = _a.amplitudesCount, amplitudesCount = _b === void 0 ? 40 : _b, _c = _a.progress, progress = _c === void 0 ? 0 : _c, _d = _a.relativeAmplitudeBarWidth, relativeAmplitudeBarWidth = _d === void 0 ? 2 : _d, _e = _a.relativeAmplitudeGap, relativeAmplitudeGap = _e === void 0 ? 1 : _e, seek = _a.seek, waveformData = _a.waveformData;
    var _f = (0, react_1.useState)(null), progressIndicator = _f[0], setProgressIndicator = _f[1];
    var isDragging = (0, react_1.useRef)(false);
    var _g = (0, react_1.useState)(null), root = _g[0], setRoot = _g[1];
    var _h = (0, react_1.useState)(), trackAxisX = _h[0], setTrackAxisX = _h[1];
    var lastRootWidth = (0, react_1.useRef)(undefined);
    var handleDragStart = function (e) {
        e.preventDefault();
        if (!progressIndicator)
            return;
        isDragging.current = true;
        progressIndicator.style.cursor = 'grabbing';
    };
    var handleDrag = function (e) {
        if (!isDragging.current)
            return;
        // Due to throttling of seek, it is necessary to create a copy (snapshot) of the event.
        // Otherwise, the event would be nullified at the point when the throttled function is executed.
        seek(__assign({}, e));
    };
    var handleDragStop = (0, react_1.useCallback)(function () {
        if (!progressIndicator)
            return;
        isDragging.current = false;
        progressIndicator.style.removeProperty('cursor');
    }, [progressIndicator]);
    var getTrackAxisX = (0, react_1.useMemo)(function () {
        return (0, lodash_throttle_1.default)(function (rootWidth) {
            if (rootWidth === lastRootWidth.current)
                return;
            lastRootWidth.current = rootWidth;
            var possibleAmpCount = Math.floor(rootWidth / (relativeAmplitudeGap + relativeAmplitudeBarWidth));
            var tooManyAmplitudesToRender = possibleAmpCount < amplitudesCount;
            var barCount = tooManyAmplitudesToRender ? possibleAmpCount : amplitudesCount;
            var amplitudeBarWidthToGapRatio = relativeAmplitudeBarWidth / (relativeAmplitudeBarWidth + relativeAmplitudeGap);
            var barWidth = barCount && (rootWidth / barCount) * amplitudeBarWidthToGapRatio;
            setTrackAxisX({
                barCount: barCount,
                barWidth: barWidth,
                gap: barWidth * (relativeAmplitudeGap / relativeAmplitudeBarWidth),
            });
        }, 1);
    }, [relativeAmplitudeBarWidth, relativeAmplitudeGap, amplitudesCount]);
    var resampledWaveformData = (0, react_1.useMemo)(function () { return (trackAxisX ? (0, audioSampling_1.resampleWaveformData)(waveformData, trackAxisX.barCount) : []); }, [trackAxisX, waveformData]);
    (0, react_1.useEffect)(function () {
        document.addEventListener('pointerup', handleDragStop);
        return function () {
            document.removeEventListener('pointerup', handleDragStop);
        };
    }, [handleDragStop]);
    (0, react_1.useEffect)(function () {
        if (!root || typeof ResizeObserver === 'undefined')
            return;
        var observer = new ResizeObserver(function (_a) {
            var entry = _a[0];
            getTrackAxisX(entry.contentRect.width);
        });
        observer.observe(root);
        return function () {
            observer.disconnect();
        };
    }, [getTrackAxisX, root]);
    (0, react_1.useLayoutEffect)(function () {
        if (!root)
            return;
        var rootWidth = root.getBoundingClientRect().width;
        getTrackAxisX(rootWidth);
    }, [getTrackAxisX, root]);
    if (!waveformData.length || (trackAxisX === null || trackAxisX === void 0 ? void 0 : trackAxisX.barCount) === 0)
        return null;
    return (<div className='str-chat__wave-progress-bar__track' data-testid='wave-progress-bar-track' onClick={seek} onPointerDown={handleDragStart} onPointerMove={handleDrag} onPointerUp={handleDragStop} ref={setRoot} role='progressbar' style={{
            '--str-chat__voice-recording-amplitude-bar-gap-width': (trackAxisX === null || trackAxisX === void 0 ? void 0 : trackAxisX.gap) + 'px',
        }}>
      {resampledWaveformData.map(function (amplitude, i) {
            var _a;
            return (<div className={(0, clsx_1.default)('str-chat__wave-progress-bar__amplitude-bar', (_a = {},
                    _a['str-chat__wave-progress-bar__amplitude-bar--active'] = progress > (i / resampledWaveformData.length) * 100,
                    _a))} data-testid='amplitude-bar' key={"amplitude-".concat(i)} style={{
                    '--str-chat__voice-recording-amplitude-bar-width': (trackAxisX === null || trackAxisX === void 0 ? void 0 : trackAxisX.barWidth) + 'px',
                    '--str-chat__wave-progress-bar__amplitude-bar-height': amplitude
                        ? amplitude * 100 + '%'
                        : '0%',
                }}/>);
        })}
      <div className='str-chat__wave-progress-bar__progress-indicator' data-testid='wave-progress-bar-progress-indicator' ref={setProgressIndicator} style={{ left: "".concat(progress < 0 ? 0 : progress > 100 ? 100 : progress, "%") }}/>
    </div>);
};
exports.WaveProgressBar = WaveProgressBar;
