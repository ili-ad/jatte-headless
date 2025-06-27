"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useEnrichedMessages_1 = require("../src/useEnrichedMessages");
describe('useEnrichedMessages', function () {
    test('returns messages unchanged and empty group styles', function () {
        var messages = [{ id: '1' }, { id: '2' }];
        var result = (0, react_1.renderHook)(function () {
            return (0, useEnrichedMessages_1.useEnrichedMessages)({
                channel: {},
                disableDateSeparator: false,
                hideDeletedMessages: false,
                hideNewMessageSeparator: false,
                messages: messages,
                noGroupByUser: false,
            });
        }).result;
        expect(result.current.messages).toBe(messages);
        expect(result.current.messageGroupStyles).toEqual({});
    });
});
