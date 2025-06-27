"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var Chat_1 = require("../src/Chat");
describe('Chat component', function () {
    it('renders children', function () {
        var html = (0, server_1.renderToStaticMarkup)(<Chat_1.Chat client={{}}>child</Chat_1.Chat>);
        expect(html).toContain('child');
    });
});
