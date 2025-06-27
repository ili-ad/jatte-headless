"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageComponent = void 0;
var react_1 = require("react");
var sanitize_url_1 = require("@braintree/sanitize-url");
var BaseImage_1 = require("./BaseImage");
var Modal_1 = require("../Modal");
var ModalGallery_1 = require("./ModalGallery");
var context_1 = require("../../context");
/**
 * A simple component that displays an image.
 */
var ImageComponent = function (props) {
    var _a = props.dimensions, dimensions = _a === void 0 ? {} : _a, fallback = props.fallback, image_url = props.image_url, innerRef = props.innerRef, previewUrl = props.previewUrl, style = props.style, thumb_url = props.thumb_url;
    var _b = (0, react_1.useState)(false), modalIsOpen = _b[0], setModalIsOpen = _b[1];
    var _c = (0, context_1.useComponentContext)('ImageComponent'), _d = _c.BaseImage, BaseImage = _d === void 0 ? BaseImage_1.BaseImage : _d, _e = _c.ModalGallery, ModalGallery = _e === void 0 ? ModalGallery_1.ModalGallery : _e;
    var imageSrc = (0, sanitize_url_1.sanitizeUrl)(previewUrl || image_url || thumb_url);
    var toggleModal = function () { return setModalIsOpen(function (modalIsOpen) { return !modalIsOpen; }); };
    return (<>
      <BaseImage alt={fallback} className='str-chat__message-attachment--img' data-testid='image-test' onClick={toggleModal} src={imageSrc} style={style} tabIndex={0} title={fallback} {...dimensions} {...(innerRef && { ref: innerRef })}/>
      <Modal_1.Modal className='str-chat__image-modal' onClose={toggleModal} open={modalIsOpen}>
        <ModalGallery images={[props]} index={0}/>
      </Modal_1.Modal>
    </>);
};
exports.ImageComponent = ImageComponent;
