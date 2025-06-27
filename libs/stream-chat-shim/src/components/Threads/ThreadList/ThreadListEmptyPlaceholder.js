"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadListEmptyPlaceholder = void 0;
var react_1 = require("react");
var icons_1 = require("../icons");
var ThreadListEmptyPlaceholder = function () { return (<div className='str-chat__thread-list-empty-placeholder'>
    <icons_1.Icon.MessageBubble />
    {/* TODO: translate */}
    No threads here yet...
  </div>); };
exports.ThreadListEmptyPlaceholder = ThreadListEmptyPlaceholder;
