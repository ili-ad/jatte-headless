"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('localMessageToNewMessagePayload', function () {
    test('maps id and user_id', function () {
        var local = { id: 'temp1', text: 'hi', user_id: 'u1', extra: 42 };
        var msg = (0, index_1.localMessageToNewMessagePayload)(local);
        expect(msg).toEqual({ tmp_id: 'temp1', text: 'hi', extra: 42, user: { id: 'u1' } });
    });
});
