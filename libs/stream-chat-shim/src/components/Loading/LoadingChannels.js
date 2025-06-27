"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingChannels = void 0;
var react_1 = require("react");
var LoadingItems = function () { return (<div className='str-chat__loading-channels-item str-chat__channel-preview-loading'>
    <div className='str-chat__loading-channels-avatar'/>
    <div className='str-chat__loading-channels-meta str-chat__channel-preview-end-loading'>
      <div className='str-chat__loading-channels-username'/>
      <div className='str-chat__loading-channels-status'/>
    </div>
  </div>); };
var UnMemoizedLoadingChannels = function () { return (<div className='str-chat__loading-channels'>
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
  </div>); };
/**
 * Loading indicator for the ChannelList
 */
exports.LoadingChannels = react_1.default.memo(UnMemoizedLoadingChannels);
