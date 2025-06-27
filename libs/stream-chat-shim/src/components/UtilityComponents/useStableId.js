"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStableId = void 0;
var nanoid_1 = require("nanoid");
var react_1 = require("react");
/**
 * The ID is generated using the `nanoid` library and is memoized to ensure
 * that it remains the same across renders unless the key changes.
 */
var useStableId = function (key) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    var id = (0, react_1.useMemo)(function () { return (0, nanoid_1.nanoid)(); }, [key]);
    return id;
};
exports.useStableId = useStableId;
