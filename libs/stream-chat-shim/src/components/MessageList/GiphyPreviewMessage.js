"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiphyPreviewMessage = void 0;
var react_1 = require("react");
var Message_1 = require("../Message/Message");
var GiphyPreviewMessage = function (props) {
    var message = props.message;
    return (<div className='giphy-preview-message'>
      <Message_1.Message message={message}/>
    </div>);
};
exports.GiphyPreviewMessage = GiphyPreviewMessage;
