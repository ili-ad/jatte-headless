"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var ChatView_1 = require("../src/ChatView");
describe('ChatView component', function () {
    it('renders children', function () {
        var html = (0, server_1.renderToStaticMarkup)(<ChatView_1.ChatView>child</ChatView_1.ChatView>);
        expect(html).toContain('child');
    });
});
