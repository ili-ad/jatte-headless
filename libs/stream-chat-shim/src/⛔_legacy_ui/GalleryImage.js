"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryImage = void 0;
var react_1 = require("react");
/**
 * Placeholder component for Stream's Gallery Image.
 * Renders a simple <img> element using the provided URLs.
 */
var GalleryImage = function (props) {
    var _a = props.dimensions, dimensions = _a === void 0 ? {} : _a, fallback = props.fallback, image_url = props.image_url, innerRef = props.innerRef, previewUrl = props.previewUrl, style = props.style, thumb_url = props.thumb_url;
    var src = previewUrl || image_url || thumb_url;
    return (<img alt={fallback} data-testid="gallery-image" src={src} style={style} title={fallback} {...dimensions} {...(innerRef && { ref: innerRef })}/>);
};
exports.GalleryImage = GalleryImage;
exports.default = exports.GalleryImage;
