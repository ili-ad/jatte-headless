"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
var react_1 = require("react");
constructor(_opts, any);
{ }
var ChannelSearchSource = /** @class */ (function () {
    function ChannelSearchSource(_client) {
    }
    return ChannelSearchSource;
}());
var MessageSearchSource = /** @class */ (function () {
    function MessageSearchSource(_client) {
    }
    return MessageSearchSource;
}());
var UserSearchSource = /** @class */ (function () {
    function UserSearchSource(_client) {
    }
    return UserSearchSource;
}());
var useChat_1 = require("./hooks/useChat");
var useCreateChatContext_1 = require("./hooks/useCreateChatContext");
var useChannelsQueryState_1 = require("./hooks/useChannelsQueryState");
var ChatContext_1 = require("../../context/ChatContext");
var TranslationContext_1 = require("../../context/TranslationContext");
/**
 * Wrapper component for a StreamChat application. Chat needs to be placed around any other chat components
 * as it provides the ChatContext.
 */
var Chat = function (props) {
    var children = props.children, client = props.client, customClasses = props.customClasses, defaultLanguage = props.defaultLanguage, i18nInstance = props.i18nInstance, _a = props.initialNavOpen, initialNavOpen = _a === void 0 ? true : _a, isMessageAIGenerated = props.isMessageAIGenerated, customChannelSearchController = props.searchController, _b = props.theme, theme = _b === void 0 ? 'messaging light' : _b, _c = props.useImageFlagEmojisOnWindows, useImageFlagEmojisOnWindows = _c === void 0 ? false : _c;
    var _d = (0, useChat_1.useChat)({ client: client, defaultLanguage: defaultLanguage, i18nInstance: i18nInstance, initialNavOpen: initialNavOpen }), channel = _d.channel, closeMobileNav = _d.closeMobileNav, getAppSettings = _d.getAppSettings, latestMessageDatesByChannels = _d.latestMessageDatesByChannels, mutes = _d.mutes, navOpen = _d.navOpen, openMobileNav = _d.openMobileNav, setActiveChannel = _d.setActiveChannel, translators = _d.translators;
    var channelsQueryState = (0, useChannelsQueryState_1.useChannelsQueryState)();
    var searchController = (0, react_1.useMemo)(function () {
        return customChannelSearchController !== null && customChannelSearchController !== void 0 ? customChannelSearchController : new SearchController({
            sources: [
                new ChannelSearchSource(client),
                new UserSearchSource(client),
                new MessageSearchSource(client),
            ],
        });
    }, [client, customChannelSearchController]);
    var chatContextValue = (0, useCreateChatContext_1.useCreateChatContext)({
        channel: channel,
        channelsQueryState: channelsQueryState,
        client: client,
        closeMobileNav: closeMobileNav,
        customClasses: customClasses,
        getAppSettings: getAppSettings,
        isMessageAIGenerated: isMessageAIGenerated,
        latestMessageDatesByChannels: latestMessageDatesByChannels,
        mutes: mutes,
        navOpen: navOpen,
        openMobileNav: openMobileNav,
        searchController: searchController,
        setActiveChannel: setActiveChannel,
        theme: theme,
        useImageFlagEmojisOnWindows: useImageFlagEmojisOnWindows,
    });
    if (!translators.t)
        return null;
    return (<ChatContext_1.ChatProvider value={chatContextValue}>
      <TranslationContext_1.TranslationProvider value={translators}>{children}</TranslationContext_1.TranslationProvider>
    </ChatContext_1.ChatProvider>);
};
exports.Chat = Chat;
