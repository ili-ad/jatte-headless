"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ChatContext_1 = require("../src/ChatContext");
var createQueryState = function () { return ({
    error: null,
    queryInProgress: null,
    setError: jest.fn(),
    setQueryInProgress: jest.fn(),
}); };
describe('ChatContext', function () {
    it('provides context value', function () {
        var value = {
            channel: undefined,
            channelsQueryState: createQueryState(),
            client: {},
            closeMobileNav: jest.fn(),
            customClasses: undefined,
            getAppSettings: function () { return null; },
            latestMessageDatesByChannels: {},
            mutes: [],
            navOpen: false,
            openMobileNav: jest.fn(),
            setActiveChannel: jest.fn(),
            theme: 'messaging light',
            themeVersion: '1',
            useImageFlagEmojisOnWindows: false,
            isMessageAIGenerated: false,
        };
        var wrapper = function (_a) {
            var children = _a.children;
            return (<ChatContext_1.ChatProvider value={value}>{children}</ChatContext_1.ChatProvider>);
        };
        var result = (0, react_2.renderHook)(function () { return (0, ChatContext_1.useChatContext)(); }, { wrapper: wrapper }).result;
        expect(result.current).toBe(value);
    });
});
