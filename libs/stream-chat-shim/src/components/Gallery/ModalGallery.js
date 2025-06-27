"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalGallery = void 0;
var react_1 = require("react");
var react_image_gallery_1 = require("react-image-gallery");
var BaseImage_1 = require("./BaseImage");
var context_1 = require("../../context");
var onError = function (e) {
    // Prevent having alt attribute on img as the img takes the height of the alt text
    // instead of the CSS / element width & height when the CSS mask (fallback) is applied.
    e.target.alt = '';
};
var renderItem = function (_a) {
    var original = _a.original, originalAlt = _a.originalAlt;
    return (<BaseImage_1.BaseImage alt={originalAlt} className='image-gallery-image' onError={onError} src={original}/>);
};
var ModalGallery = function (props) {
    var images = props.images, index = props.index;
    var t = (0, context_1.useTranslationContext)('ModalGallery').t;
    var formattedArray = (0, react_1.useMemo)(function () {
        return images.map(function (image) {
            var imageSrc = image.image_url || image.thumb_url || '';
            return {
                original: imageSrc,
                originalAlt: t('User uploaded content'),
                source: imageSrc,
            };
        });
    }, [images, t]);
    return (
    // @ts-expect-error ignore the TS error as react-image-gallery was on @types/react@18 while stream-chat-react being upgraded to React 19 (https://github.com/xiaolin/react-image-gallery/issues/809)
    <react_image_gallery_1.default items={formattedArray} renderItem={renderItem} showIndex={true} showPlayButton={false} showThumbnails={false} startIndex={index}/>);
};
exports.ModalGallery = ModalGallery;
