"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("react-dom/server");
var channelPreview_utils_1 = require("../src/channelPreview-utils");
describe('channelPreview-utils', function () {
    test('renderPreviewText renders markdown', function () {
        var html = (0, server_1.renderToStaticMarkup)((0, channelPreview_utils_1.renderPreviewText)('**hi**'));
        expect(html).toContain('strong');
    });
    test('getGroupChannelDisplayInfo handles groups', function () {
        var channel = {
            state: {
                members: {
                    a: { user: { name: 'A', image: 'a.png' } },
                    b: { user: { name: 'B', image: 'b.png' } },
                    c: { user: { name: 'C', image: 'c.png' } },
                },
            },
        };
        var info = (0, channelPreview_utils_1.getGroupChannelDisplayInfo)(channel);
        expect(info === null || info === void 0 ? void 0 : info.length).toBe(3);
        expect(info === null || info === void 0 ? void 0 : info[0].name).toBe('A');
    });
});
