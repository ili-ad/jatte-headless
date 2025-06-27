"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelListMessenger = void 0;
var react_1 = require("react");
var LoadingChannels_1 = require("../Loading/LoadingChannels");
var UtilityComponents_1 = require("../UtilityComponents");
var context_1 = require("../../context");
/**
 * A preview list of channels, allowing you to select the channel you want to open
 */
var ChannelListMessenger = function (props) {
    var children = props.children, _a = props.error, error = _a === void 0 ? null : _a, loading = props.loading, _b = props.LoadingErrorIndicator, LoadingErrorIndicator = _b === void 0 ? UtilityComponents_1.NullComponent : _b, _c = props.LoadingIndicator, LoadingIndicator = _c === void 0 ? LoadingChannels_1.LoadingChannels : _c;
    var t = (0, context_1.useTranslationContext)('ChannelListMessenger').t;
    if (error) {
        return <LoadingErrorIndicator />;
    }
    if (loading) {
        return <LoadingIndicator />;
    }
    return (<div className='str-chat__channel-list-messenger str-chat__channel-list-messenger-react'>
      <div aria-label={t('aria/Channel list')} className='str-chat__channel-list-messenger__main str-chat__channel-list-messenger-react__main' role='listbox'>
        {children}
      </div>
    </div>);
};
exports.ChannelListMessenger = ChannelListMessenger;
