"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var stream_adapter_1 = require("../../src/lib/stream-adapter");
(0, vitest_1.test)('makeIntroMessage returns intro message', function () {
    var msg = (0, stream_adapter_1.makeIntroMessage)();
    (0, vitest_1.expect)(msg.customType).toBe(stream_adapter_1.CUSTOM_MESSAGE_TYPE.intro);
    (0, vitest_1.expect)(typeof msg.id).toBe('string');
});
(0, vitest_1.test)('isIntroMessage detects intro messages', function () {
    var msg = (0, stream_adapter_1.makeIntroMessage)();
    (0, vitest_1.expect)((0, stream_adapter_1.isIntroMessage)(msg)).toBe(true);
    (0, vitest_1.expect)((0, stream_adapter_1.isIntroMessage)({})).toBe(false);
});
