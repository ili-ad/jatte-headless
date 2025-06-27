"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Window = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
/**
 * A UI component for conditionally displaying a Thread or Channel
 */
var UnMemoizedWindow = function (props) {
    var children = props.children, propThread = props.thread;
    var contextThread = (0, ChannelStateContext_1.useChannelStateContext)('Window').thread;
    return (<div className={(0, clsx_1.default)('str-chat__main-panel', {
            'str-chat__main-panel--thread-open': contextThread || propThread,
        })}>
      {children}
    </div>);
};
exports.Window = react_1.default.memo(UnMemoizedWindow);
