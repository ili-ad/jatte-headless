"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = exports.CardAudio = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var react_player_1 = require("react-player");
var Gallery_1 = require("../Gallery");
var SafeAnchor_1 = require("../SafeAnchor");
var components_1 = require("./components");
var useAudioController_1 = require("./hooks/useAudioController");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var getHostFromURL = function (url) {
    if (url !== undefined && url !== null) {
        var trimmedUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
        return trimmedUrl;
    }
    return null;
};
var UnableToRenderCard = function (_a) {
    var _b;
    var type = _a.type;
    var t = (0, TranslationContext_1.useTranslationContext)('Card').t;
    return (<div className={(0, clsx_1.default)('str-chat__message-attachment-card', (_b = {},
            _b["str-chat__message-attachment-card--".concat(type)] = type,
            _b))}>
      <div className='str-chat__message-attachment-card--content'>
        <div className='str-chat__message-attachment-card--text'>
          {t('this content could not be displayed')}
        </div>
      </div>
    </div>);
};
var SourceLink = function (_a) {
    var author_name = _a.author_name, url = _a.url;
    return (<div className='str-chat__message-attachment-card--source-link' data-testid='card-source-link'>
    <SafeAnchor_1.SafeAnchor className='str-chat__message-attachment-card--url' href={url} rel='noopener noreferrer' target='_blank'>
      {author_name || getHostFromURL(url)}
    </SafeAnchor_1.SafeAnchor>
  </div>);
};
var CardHeader = function (props) {
    var asset_url = props.asset_url, dimensions = props.dimensions, image = props.image, image_url = props.image_url, thumb_url = props.thumb_url, title = props.title, type = props.type;
    var visual = null;
    if (asset_url && type === 'video') {
        visual = (<react_player_1.default className='react-player' controls height='100%' url={asset_url} width='100%'/>);
    }
    else if (image) {
        visual = (<Gallery_1.ImageComponent dimensions={dimensions} fallback={title || image} image_url={image_url} thumb_url={thumb_url}/>);
    }
    return visual ? (<div className='str-chat__message-attachment-card--header str-chat__message-attachment-card-react--header' data-testid={'card-header'}>
      {visual}
    </div>) : null;
};
var CardContent = function (props) {
    var author_name = props.author_name, og_scrape_url = props.og_scrape_url, text = props.text, title = props.title, title_link = props.title_link, type = props.type;
    var url = title_link || og_scrape_url;
    return (<div className='str-chat__message-attachment-card--content'>
      {type === 'audio' ? (<exports.CardAudio og={props}/>) : (<div className='str-chat__message-attachment-card--flex'>
          {url && <SourceLink author_name={author_name} url={url}/>}
          {title && (<div className='str-chat__message-attachment-card--title'>{title}</div>)}
          {text && <div className='str-chat__message-attachment-card--text'>{text}</div>}
        </div>)}
    </div>);
};
var CardAudio = function (_a) {
    var _b = _a.og, asset_url = _b.asset_url, author_name = _b.author_name, mime_type = _b.mime_type, og_scrape_url = _b.og_scrape_url, text = _b.text, title = _b.title, title_link = _b.title_link;
    var _c = (0, useAudioController_1.useAudioController)({
        mimeType: mime_type,
    }), audioRef = _c.audioRef, isPlaying = _c.isPlaying, progress = _c.progress, seek = _c.seek, togglePlay = _c.togglePlay;
    var url = title_link || og_scrape_url;
    var dataTestId = 'card-audio-widget';
    var rootClassName = 'str-chat__message-attachment-card-audio-widget';
    return (<div className={rootClassName} data-testid={dataTestId}>
      {asset_url && (<>
          <audio ref={audioRef}>
            <source data-testid='audio-source' src={asset_url} type='audio/mp3'/>
          </audio>
          <div className='str-chat__message-attachment-card-audio-widget--first-row'>
            <div className='str-chat__message-attachment-audio-widget--play-controls'>
              <components_1.PlayButton isPlaying={isPlaying} onClick={togglePlay}/>
            </div>
            <components_1.ProgressBar onClick={seek} progress={progress}/>
          </div>
        </>)}
      <div className='str-chat__message-attachment-audio-widget--second-row'>
        {url && <SourceLink author_name={author_name} url={url}/>}
        {title && (<div className='str-chat__message-attachment-audio-widget--title'>{title}</div>)}
        {text && (<div className='str-chat__message-attachment-audio-widget--description'>
            {text}
          </div>)}
      </div>
    </div>);
};
exports.CardAudio = CardAudio;
var UnMemoizedCard = function (props) {
    var asset_url = props.asset_url, giphy = props.giphy, image_url = props.image_url, thumb_url = props.thumb_url, title = props.title, title_link = props.title_link, type = props.type;
    var giphyVersionName = (0, ChannelStateContext_1.useChannelStateContext)('CardHeader').giphyVersion;
    var image = thumb_url || image_url;
    var dimensions = {};
    if (type === 'giphy' && typeof giphy !== 'undefined') {
        var giphyVersion = giphy[giphyVersionName];
        image = giphyVersion.url;
        dimensions.height = giphyVersion.height;
        dimensions.width = giphyVersion.width;
    }
    if (!title && !title_link && !asset_url && !image) {
        return <UnableToRenderCard />;
    }
    return (<div className={"str-chat__message-attachment-card str-chat__message-attachment-card--".concat(type)}>
      <CardHeader {...props} dimensions={dimensions} image={image}/>
      <CardContent {...props}/>
    </div>);
};
/**
 * Simple Card Layout for displaying links
 */
exports.Card = react_1.default.memo(UnMemoizedCard);
