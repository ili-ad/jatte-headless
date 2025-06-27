"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelPreviewMessenger = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var ChannelPreviewActionButtons_1 = require("./ChannelPreviewActionButtons");
var Avatar_1 = require("../Avatar");
var context_1 = require("../../context");
var UnMemoizedChannelPreviewMessenger = function (props) {
    var _a, _b;
    var active = props.active, _c = props.Avatar, Avatar = _c === void 0 ? Avatar_1.Avatar : _c, channel = props.channel, _d = props.className, customClassName = _d === void 0 ? '' : _d, displayImage = props.displayImage, displayTitle = props.displayTitle, groupChannelDisplayInfo = props.groupChannelDisplayInfo, latestMessagePreview = props.latestMessagePreview, customOnSelectChannel = props.onSelect, setActiveChannel = props.setActiveChannel, unread = props.unread, watchers = props.watchers;
    var _e = (0, context_1.useComponentContext)().ChannelPreviewActionButtons, ChannelPreviewActionButtons = _e === void 0 ? ChannelPreviewActionButtons_1.ChannelPreviewActionButtons : _e;
    var channelPreviewButton = (0, react_1.useRef)(null);
    var avatarName = displayTitle || ((_b = (_a = channel.state.messages[channel.state.messages.length - 1]) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id);
    var onSelectChannel = function (e) {
        if (customOnSelectChannel) {
            customOnSelectChannel(e);
        }
        else if (setActiveChannel) {
            setActiveChannel(channel, watchers);
        }
        if (channelPreviewButton === null || channelPreviewButton === void 0 ? void 0 : channelPreviewButton.current) {
            channelPreviewButton.current.blur();
        }
    };
    return (<div className='str-chat__channel-preview-container'>
      <ChannelPreviewActionButtons channel={channel}/>
      <button aria-label={"Select Channel: ".concat(displayTitle || '')} aria-selected={active} className={(0, clsx_1.default)("str-chat__channel-preview-messenger str-chat__channel-preview", active && 'str-chat__channel-preview-messenger--active', unread && unread >= 1 && 'str-chat__channel-preview-messenger--unread', customClassName)} data-testid='channel-preview-button' onClick={onSelectChannel} ref={channelPreviewButton} role='option'>
        <div className='str-chat__channel-preview-messenger--left'>
          <Avatar className='str-chat__avatar--channel-preview' groupChannelDisplayInfo={groupChannelDisplayInfo} image={displayImage} name={avatarName}/>
        </div>
        <div className='str-chat__channel-preview-end'>
          <div className='str-chat__channel-preview-end-first-row'>
            <div className='str-chat__channel-preview-messenger--name'>
              <span>{displayTitle}</span>
            </div>
            {!!unread && (<div className='str-chat__channel-preview-unread-badge' data-testid='unread-badge'>
                {unread}
              </div>)}
          </div>
          <div className='str-chat__channel-preview-messenger--last-message'>
            {latestMessagePreview}
          </div>
        </div>
      </button>
    </div>);
};
/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
exports.ChannelPreviewMessenger = react_1.default.memo(UnMemoizedChannelPreviewMessenger);
