"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsMounted = void 0;
var react_1 = require("react");
var useIsMounted = function () {
    var isMounted = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        isMounted.current = true;
        return function () {
            isMounted.current = false;
        };
    }, []);
    return isMounted;
};
exports.useIsMounted = useIsMounted;
