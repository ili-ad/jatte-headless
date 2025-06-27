"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettifyFileSize = prettifyFileSize;
function prettifyFileSize(bytes, precision) {
    if (precision === void 0) { precision = 3; }
    var units = ['B', 'kB', 'MB', 'GB'];
    var exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    var mantissa = bytes / Math.pow(1024, exponent);
    var formattedMantissa = precision === 0 ? Math.round(mantissa).toString() : mantissa.toPrecision(precision);
    return "".concat(formattedMantissa, " ").concat(units[exponent]);
}
