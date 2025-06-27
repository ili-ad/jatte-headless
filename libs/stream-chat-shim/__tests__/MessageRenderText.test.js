"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("react-dom/server");
var renderText_1 = require("../src/components/Message/renderText/renderText");
test('renders markdown text', function () {
    var html = (0, server_1.renderToStaticMarkup)((0, renderText_1.renderText)('**hi**'));
    expect(html).toContain('strong');
});
