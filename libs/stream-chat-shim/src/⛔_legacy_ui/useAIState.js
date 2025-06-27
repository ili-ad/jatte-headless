"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAIState = exports.AIStates = void 0;
var react_1 = require("react");
/** States reported by the AI back-end */
exports.AIStates = {
    Error: 'AI_STATE_ERROR',
    ExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
    Generating: 'AI_STATE_GENERATING',
    Idle: 'AI_STATE_IDLE',
    Thinking: 'AI_STATE_THINKING',
};
/**
 * React hook that tracks AI state events on a channel.
 *
 * @param channel - The channel for which the AI state should be tracked.
 * @returns The latest AI state for the channel.
 */
var useAIState = function (channel) {
    var _a = (0, react_1.useState)(exports.AIStates.Idle), aiState = _a[0], setAiState = _a[1];
    (0, react_1.useEffect)(function () {
        if (!channel)
            return;
        var indicatorChangedListener = channel.on('ai_indicator.update', function (event) {
            var cid = event.cid;
            var state = event.ai_state;
            if (channel.cid === cid) {
                setAiState(state);
            }
        });
        var indicatorClearedListener = channel.on('ai_indicator.clear', function (event) {
            var cid = event.cid;
            if (channel.cid === cid) {
                setAiState(exports.AIStates.Idle);
            }
        });
        return function () {
            indicatorChangedListener.unsubscribe();
            indicatorClearedListener.unsubscribe();
        };
    }, [channel]);
    return { aiState: aiState };
};
exports.useAIState = useAIState;
