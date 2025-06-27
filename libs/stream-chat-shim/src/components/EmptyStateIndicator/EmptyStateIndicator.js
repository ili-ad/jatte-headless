"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyStateIndicator = void 0;
var react_1 = require("react");
var TranslationContext_1 = require("../../context/TranslationContext");
var icons_1 = require("./icons");
var UnMemoizedEmptyStateIndicator = function (props) {
    var listType = props.listType;
    var t = (0, TranslationContext_1.useTranslationContext)('EmptyStateIndicator').t;
    if (listType === 'thread')
        return null;
    if (listType === 'channel') {
        var text = t('You have no channels currently');
        return (<>
        <div className='str-chat__channel-list-empty'>
          <icons_1.ChatBubble />
          <p role='listitem'>{text}</p>
        </div>
      </>);
    }
    if (listType === 'message') {
        var text = t('No chats here yet…');
        return (<div className='str-chat__empty-channel'>
        <icons_1.ChatBubble />
        <p className='str-chat__empty-channel-text' role='listitem'>
          {text}
        </p>
      </div>);
    }
    return <p>No items exist</p>;
};
exports.EmptyStateIndicator = react_1.default.memo(UnMemoizedEmptyStateIndicator);
