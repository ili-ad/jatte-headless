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
var react_1 = require("@testing-library/react");
var events_1 = require("events");
var useIsChannelMuted_1 = require("../src/useIsChannelMuted");
var FakeChannel = /** @class */ (function (_super) {
    __extends(FakeChannel, _super);
    function FakeChannel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.muted = false;
        _this.client = _this;
        return _this;
    }
    FakeChannel.prototype.muteStatus = function () {
        return this.muted;
    };
    return FakeChannel;
}(events_1.EventEmitter));
describe('useIsChannelMuted', function () {
    test('tracks muted state on events', function () {
        var channel = new FakeChannel();
        var result = (0, react_1.renderHook)(function () { return (0, useIsChannelMuted_1.useIsChannelMuted)(channel); }).result;
        expect(result.current).toBe(false);
        (0, react_1.act)(function () {
            channel.muted = true;
            channel.emit('notification.channel_mutes_updated');
        });
        expect(result.current).toBe(true);
    });
});
