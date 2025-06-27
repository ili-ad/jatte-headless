"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelHeader = void 0;
var react_1 = require("react");
var DefaultMenuIcon = function () { return null; }; // temporary shim
var DefaultAvatar = (function () { return null; }); // temporary shim
var useChannelPreviewInfo = function () { return ({
    displayImage: undefined,
    displayTitle: undefined,
    groupChannelDisplayInfo: undefined,
}); };
var useChannelStateContext = function (_componentName) { return ({}); }; // temporary shim
var useChatContext = function (_componentName) { return ({}); }; // temporary shim
var useTranslationContext = function (_componentName) { return ({ t: function (s) { return s; } }); }; // temporary shim
/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
var ChannelHeader = function (props) {
    var _a = props.Avatar, Avatar = _a === void 0 ? DefaultAvatar : _a, overrideImage = props.image, live = props.live, _b = props.MenuIcon, MenuIcon = _b === void 0 ? DefaultMenuIcon : _b, overrideTitle = props.title;
    var _c = useChannelStateContext('ChannelHeader'), channel = _c.channel, watcher_count = _c.watcher_count;
    var openMobileNav = useChatContext('ChannelHeader').openMobileNav;
    var t = useTranslationContext('ChannelHeader').t;
    var _d = useChannelPreviewInfo({
        channel: channel,
        overrideImage: overrideImage,
        overrideTitle: overrideTitle,
    }), displayImage = _d.displayImage, displayTitle = _d.displayTitle, groupChannelDisplayInfo = _d.groupChannelDisplayInfo;
    var _e = (channel === null || channel === void 0 ? void 0 : channel.data) || {}, member_count = _e.member_count, subtitle = _e.subtitle;
    return (<div className='str-chat__channel-header'>
      <button aria-label={t('aria/Menu')} className='str-chat__header-hamburger' onClick={openMobileNav}>
        <MenuIcon />
      </button>
      <Avatar className='str-chat__avatar--channel-header' groupChannelDisplayInfo={groupChannelDisplayInfo} image={displayImage} name={displayTitle}/>
      <div className='str-chat__channel-header-end'>
        <p className='str-chat__channel-header-title'>
          {displayTitle}{' '}
          {live && (<span className='str-chat__header-livestream-livelabel'>{t('live')}</span>)}
        </p>
        {subtitle && <p className='str-chat__channel-header-subtitle'>{subtitle}</p>}
        <p className='str-chat__channel-header-info'>
          {!live && !!member_count && member_count > 0 && (<>
              {t('{{ memberCount }} members', {
                memberCount: member_count,
            })}
              ,{' '}
            </>)}
          {t('{{ watcherCount }} online', { watcherCount: watcher_count })}
        </p>
      </div>
    </div>);
};
exports.ChannelHeader = ChannelHeader;
