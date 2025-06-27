"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useMediaRecorder_1 = require("../src/useMediaRecorder");
describe('useMediaRecorder', function () {
    it('returns placeholder controller', function () {
        var result = (0, react_1.renderHook)(function () {
            return (0, useMediaRecorder_1.useMediaRecorder)({
                asyncMessagesMultiSendEnabled: false,
                enabled: true,
                handleSubmit: jest.fn(),
            });
        }).result;
        expect(typeof result.current.completeRecording).toBe('function');
        expect(result.current.recording).toBeUndefined();
        expect(result.current.recordingState).toBeUndefined();
    });
});
