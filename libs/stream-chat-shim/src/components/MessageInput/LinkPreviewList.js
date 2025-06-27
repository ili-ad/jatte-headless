"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkPreviewCard = exports.LinkPreviewList = void 0;
var clsx_1 = require("clsx");
var react_1 = require("react");
from;
'stream-chat';
LinkPreview,
    LinkPreviewsManagerState,
    MessageComposerState,
;
from;
'chat-shim';
var store_1 = require("../../store");
var Tooltip_1 = require("../Tooltip");
var hooks_1 = require("../Tooltip/hooks");
var hooks_2 = require("./hooks");
var icons_1 = require("./icons");
var linkPreviewsManagerStateSelector = function (state) { return ({
    linkPreviews: Array.from(state.previews.values()).filter(function (preview) {
        return LinkPreviewsManager.previewIsLoaded(preview) ||
            LinkPreviewsManager.previewIsLoading(preview);
    }),
}); };
var messageComposerStateSelector = function (state) { return ({
    quotedMessage: state.quotedMessage,
}); };
var LinkPreviewList = function () {
    var messageComposer = (0, hooks_2.useMessageComposer)();
    var linkPreviewsManager = messageComposer.linkPreviewsManager;
    var quotedMessage = (0, store_1.useStateStore)(messageComposer.state, messageComposerStateSelector).quotedMessage;
    var linkPreviews = (0, store_1.useStateStore)(linkPreviewsManager.state, linkPreviewsManagerStateSelector).linkPreviews;
    var showLinkPreviews = linkPreviews.length > 0 && !quotedMessage;
    if (!showLinkPreviews)
        return null;
    return (<div className='str-chat__link-preview-list'>
      {linkPreviews.map(function (linkPreview) { return (<exports.LinkPreviewCard key={linkPreview.og_scrape_url} linkPreview={linkPreview}/>); })}
    </div>);
};
exports.LinkPreviewList = LinkPreviewList;
var LinkPreviewCard = function (_a) {
    var linkPreview = _a.linkPreview;
    var linkPreviewsManager = (0, hooks_2.useMessageComposer)().linkPreviewsManager;
    var _b = (0, hooks_1.useEnterLeaveHandlers)(), handleEnter = _b.handleEnter, handleLeave = _b.handleLeave, tooltipVisible = _b.tooltipVisible;
    var _c = (0, react_1.useState)(null), referenceElement = _c[0], setReferenceElement = _c[1];
    if (!LinkPreviewsManager.previewIsLoaded(linkPreview) &&
        !LinkPreviewsManager.previewIsLoading(linkPreview))
        return null;
    return (<div className={(0, clsx_1.default)('str-chat__link-preview-card', {
            'str-chat__link-preview-card--loading': LinkPreviewsManager.previewIsLoading(linkPreview),
        })} data-testid='link-preview-card'>
      <Tooltip_1.PopperTooltip offset={[0, 5]} referenceElement={referenceElement} visible={tooltipVisible}>
        {linkPreview.og_scrape_url}
      </Tooltip_1.PopperTooltip>
      <div className='str-chat__link-preview-card__icon-container' onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={setReferenceElement}>
        <icons_1.LinkIcon />
      </div>
      <div className='str-chat__link-preview-card__content'>
        <div className='str-chat__link-preview-card__content-title'>
          {linkPreview.title}
        </div>
        <div className='str-chat__link-preview-card__content-description'>
          {linkPreview.text}
        </div>
      </div>
      <button className='str-chat__link-preview-card__dismiss-button' data-testid='link-preview-card-dismiss-btn' onClick={function () { return linkPreviewsManager.dismissPreview(linkPreview.og_scrape_url); }} type='button'>
        <icons_1.CloseIcon />
      </button>
    </div>);
};
exports.LinkPreviewCard = LinkPreviewCard;
