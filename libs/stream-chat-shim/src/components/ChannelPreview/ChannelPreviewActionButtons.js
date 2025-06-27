"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelPreviewActionButtons = ChannelPreviewActionButtons;
var react_1 = require("react");
var clsx_1 = require("clsx");
var ChannelList_1 = require("../ChannelList");
var icons_1 = require("./icons");
var context_1 = require("../../context");
function ChannelPreviewActionButtons(_a) {
    var channel = _a.channel;
    var membership = (0, ChannelList_1.useChannelMembershipState)(channel);
    var t = (0, context_1.useTranslationContext)().t;
    return (<div className='str-chat__channel-preview__action-buttons'>
      <button aria-label={membership.pinned_at ? t('Unpin') : t('Pin')} className={(0, clsx_1.default)('str-chat__channel-preview__action-button', 'str-chat__channel-preview__action-button--pin', membership.pinned_at && 'str-chat__channel-preview__action-button--active')} onClick={function (e) {
            e.stopPropagation();
            if (membership.pinned_at) {
            }
            else {
            }
        }} title={membership.pinned_at ? t('Unpin') : t('Pin')}>
        <icons_1.Icon.Pin />
      </button>
      <button aria-label={membership.archived_at ? t('Unarchive') : t('Archive')} className={(0, clsx_1.default)('str-chat__channel-preview__action-button', 'str-chat__channel-preview__action-button--archive', membership.archived_at && 'str-chat__channel-preview__action-button--active')} onClick={function (e) {
            e.stopPropagation();
            if (membership.archived_at) {
            }
            else {
            }
        }} title={membership.archived_at ? t('Unarchive') : t('Archive')}>
        <icons_1.Icon.ArchiveBox />
      </button>
    </div>);
}
