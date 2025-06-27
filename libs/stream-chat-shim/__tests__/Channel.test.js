"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var Channel_1 = require("../src/Channel");
describe('Channel component', function () {
    test('renders children', function () {
        var html = (0, server_1.renderToStaticMarkup)(<Channel_1.Channel>child</Channel_1.Channel>);
        expect(html).toContain('child');
    });
});
