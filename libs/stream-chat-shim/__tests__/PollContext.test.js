"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var PollContext_1 = require("../src/PollContext");
describe('PollContext shim', function () {
    it('renders children when poll is provided', function () {
        var html = (0, server_1.renderToStaticMarkup)(<PollContext_1.PollProvider poll={{}}>child</PollContext_1.PollProvider>);
        expect(html).toContain('child');
    });
    it('usePollContext returns provided poll', function () {
        var Test = function () {
            var poll = (0, PollContext_1.usePollContext)().poll;
            return <span>{poll ? 'ok' : 'no'}</span>;
        };
        var html = (0, server_1.renderToStaticMarkup)(<PollContext_1.PollProvider poll={{ id: '1' }}>
        <Test />
      </PollContext_1.PollProvider>);
        expect(html).toContain('ok');
    });
});
