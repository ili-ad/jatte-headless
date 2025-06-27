"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var TypingContext_1 = require("../src/TypingContext");
describe('TypingContext', function () {
    it('provides context value', function () {
        var value = { typing: { user1: true } };
        var received;
        var Consumer = function () {
            received = (0, TypingContext_1.useTypingContext)();
            return <span>child</span>;
        };
        var html = (0, server_1.renderToStaticMarkup)(<TypingContext_1.TypingProvider value={value}>
        <Consumer />
      </TypingContext_1.TypingProvider>);
        expect(html).toContain('child');
        expect(received).toBe(value);
    });
});
