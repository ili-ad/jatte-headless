"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingChannel = void 0;
var react_1 = require("react");
var LoadingMessage = function () { return (<div className='str-chat__loading-channel-message'>
    <div className='str-chat__loading-channel-message-avatar'></div>
    <div className='str-chat__loading-channel-message-end'>
      <div className='str-chat__loading-channel-message-sender'></div>
      <div className='str-chat__loading-channel-message-last-row'>
        <div className='str-chat__loading-channel-message-text'></div>
        <div className='str-chat__loading-channel-message-date'></div>
      </div>
    </div>
  </div>); };
var LoadingMessageInput = function () { return (<div className='str-chat__loading-channel-message-input-row'>
    <div className='str-chat__loading-channel-message-input'></div>
    <div className='str-chat__loading-channel-message-send'></div>
  </div>); };
var LoadingChannelHeader = function () { return (<div className='str-chat__loading-channel-header'>
    <div className='str-chat__loading-channel-header-avatar'></div>
    <div className='str-chat__loading-channel-header-end'>
      <div className='str-chat__loading-channel-header-name'></div>
      <div className='str-chat__loading-channel-header-info'></div>
    </div>
  </div>); };
var LoadingChannel = function () { return (<div className='str-chat__loading-channel'>
    <LoadingChannelHeader />
    <div className='str-chat__loading-channel-message-list'>
      {Array.from(Array(3)).map(function (_, i) { return (<LoadingMessage key={"loading-message-".concat(i)}/>); })}
    </div>
    <LoadingMessageInput />
  </div>); };
exports.LoadingChannel = LoadingChannel;
