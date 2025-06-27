"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useUserRole_1 = require("../src/useUserRole");
describe('useUserRole', function () {
    test('returns default permissions and detects own message', function () {
        var message = {
            user: { id: 'alice' },
            client: { userID: 'alice' },
        };
        var result = (0, react_1.renderHook)(function () { return (0, useUserRole_1.useUserRole)(message); }).result;
        expect(result.current.isMyMessage).toBe(true);
        expect(result.current.canEdit).toBe(false);
        expect(result.current.canDelete).toBe(false);
    });
});
