"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gallery = void 0;
var react_1 = require("react");
var sanitize_url_1 = require("@braintree/sanitize-url");
var clsx_1 = require("clsx");
var BaseImage_1 = require("./BaseImage");
var Modal_1 = require("../Modal");
var ModalGallery_1 = require("./ModalGallery");
var ComponentContext_1 = require("../../context/ComponentContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var UnMemoizedGallery = function (props) {
    var images = props.images, innerRefs = props.innerRefs;
    var _a = (0, react_1.useState)(0), index = _a[0], setIndex = _a[1];
    var _b = (0, react_1.useState)(false), modalOpen = _b[0], setModalOpen = _b[1];
    var _c = (0, ComponentContext_1.useComponentContext)('Gallery'), _d = _c.BaseImage, BaseImage = _d === void 0 ? BaseImage_1.BaseImage : _d, _e = _c.ModalGallery, ModalGallery = _e === void 0 ? ModalGallery_1.ModalGallery : _e;
    var t = (0, TranslationContext_1.useTranslationContext)('Gallery').t;
    var imageFallbackTitle = t('User uploaded content');
    var countImagesDisplayedInPreview = 4;
    var lastImageIndexInPreview = countImagesDisplayedInPreview - 1;
    var toggleModal = function (selectedIndex) {
        if (modalOpen) {
            setModalOpen(false);
        }
        else {
            setIndex(selectedIndex);
            setModalOpen(true);
        }
    };
    var renderImages = images.slice(0, countImagesDisplayedInPreview).map(function (image, i) {
        return i === lastImageIndexInPreview && images.length > countImagesDisplayedInPreview ? (<button className='str-chat__gallery-placeholder' data-testid='gallery-image-last' key={"gallery-image-".concat(i)} onClick={function () { return toggleModal(i); }} style={__assign({ backgroundImage: "url(".concat(images[lastImageIndexInPreview].previewUrl ||
                    images[lastImageIndexInPreview].image_url ||
                    images[lastImageIndexInPreview].thumb_url, ")") }, image.style)} {...((innerRefs === null || innerRefs === void 0 ? void 0 : innerRefs.current) && {
            ref: function (r) {
                innerRefs.current[i] = r;
            },
        })}>
        <p>
          {t('{{ imageCount }} more', {
                imageCount: images.length - countImagesDisplayedInPreview,
            })}
        </p>
      </button>) : (<button className='str-chat__gallery-image' data-testid='gallery-image' key={"gallery-image-".concat(i)} onClick={function () { return toggleModal(i); }}>
        <BaseImage alt={(image === null || image === void 0 ? void 0 : image.fallback) || imageFallbackTitle} src={(0, sanitize_url_1.sanitizeUrl)(image.previewUrl || image.image_url || image.thumb_url)} style={image.style} title={(image === null || image === void 0 ? void 0 : image.fallback) || imageFallbackTitle} {...((innerRefs === null || innerRefs === void 0 ? void 0 : innerRefs.current) && {
            ref: function (r) {
                innerRefs.current[i] = r;
            },
        })}/>
      </button>);
    });
    var className = (0, clsx_1.default)('str-chat__gallery', {
        'str-chat__gallery--square': images.length > lastImageIndexInPreview,
        'str-chat__gallery-two-rows': images.length > 2,
    });
    return (<div className={className}>
      {renderImages}
      <Modal_1.Modal className='str-chat__gallery-modal' onClose={function () { return setModalOpen(function (modalOpen) { return !modalOpen; }); }} open={modalOpen}>
        <ModalGallery images={images} index={index}/>
      </Modal_1.Modal>
    </div>);
};
/**
 * Displays images in a simple responsive grid with a light box to view the images.
 */
exports.Gallery = react_1.default.memo(UnMemoizedGallery);
