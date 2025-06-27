"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageDimensions = exports.isMutableRef = void 0;
var isMutableRef = function (ref) {
    if (ref) {
        return ref.current !== undefined;
    }
    return false;
};
exports.isMutableRef = isMutableRef;
var getImageDimensions = function (source) {
    return new Promise(function (resolve, reject) {
        var image = new Image();
        image.addEventListener('load', function () {
            resolve([image.width, image.height]);
        }, { once: true });
        image.addEventListener('error', function () { return reject("Couldn't load image from ".concat(source)); }, {
            once: true,
        });
        image.src = source;
    });
};
exports.getImageDimensions = getImageDimensions;
