"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useUnreadMessagesNotificationVirtualized_1 = require("../src/useUnreadMessagesNotificationVirtualized");
describe('useUnreadMessagesNotificationVirtualized', function () {
    var makeMessage = function (created_at) { return ({ created_at: created_at }); };
    test('toggles visibility based on rendered messages', function () {
        var lastRead = new Date('2021-01-01T12:00:00Z');
        var result = (0, react_1.renderHook)(function () {
            return (0, useUnreadMessagesNotificationVirtualized_1.useUnreadMessagesNotificationVirtualized)({
                showAlways: false,
                unreadCount: 1,
                lastRead: lastRead,
            });
        }).result;
        (0, react_1.act)(function () {
            result.current.toggleShowUnreadMessagesNotification([
                makeMessage('2021-01-01T13:00:00Z'),
                makeMessage('2021-01-01T14:00:00Z'),
            ]);
        });
        expect(result.current.show).toBe(true);
        (0, react_1.act)(function () {
            result.current.toggleShowUnreadMessagesNotification([
                makeMessage('2020-12-31T23:00:00Z'),
                makeMessage('2020-12-31T23:59:59Z'),
            ]);
        });
        expect(result.current.show).toBe(false);
    });
    test('hides when unread count resets', function () {
        var lastRead = new Date('2021-01-01T12:00:00Z');
        var _a = (0, react_1.renderHook)(function (_a) {
            var count = _a.count;
            return (0, useUnreadMessagesNotificationVirtualized_1.useUnreadMessagesNotificationVirtualized)({
                showAlways: false,
                unreadCount: count,
                lastRead: lastRead,
            });
        }, { initialProps: { count: 1 } }), result = _a.result, rerender = _a.rerender;
        (0, react_1.act)(function () {
            result.current.toggleShowUnreadMessagesNotification([
                makeMessage('2021-01-01T13:00:00Z'),
                makeMessage('2021-01-01T14:00:00Z'),
            ]);
        });
        expect(result.current.show).toBe(true);
        rerender({ count: 0 });
        expect(result.current.show).toBe(false);
    });
});
