"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepliesCountButton = void 0;
var react_1 = require("react");
var TranslationContext_1 = require("../../context/TranslationContext");
var UnMemoizedMessageRepliesCountButton = function (props) {
    var labelPlural = props.labelPlural, labelSingle = props.labelSingle, onClick = props.onClick, _a = props.reply_count, reply_count = _a === void 0 ? 0 : _a;
    var t = (0, TranslationContext_1.useTranslationContext)('MessageRepliesCountButton').t;
    if (!reply_count)
        return null;
    var replyCountText = t('replyCount', { count: reply_count });
    if (labelPlural && reply_count > 1) {
        replyCountText = "".concat(reply_count, " ").concat(labelPlural);
    }
    else if (labelSingle) {
        replyCountText = "1 ".concat(labelSingle);
    }
    return (<div className='str-chat__message-replies-count-button-wrapper'>
      <button className='str-chat__message-replies-count-button' data-testid='replies-count-button' onClick={onClick}>
        {replyCountText}
      </button>
    </div>);
};
exports.MessageRepliesCountButton = react_1.default.memo(UnMemoizedMessageRepliesCountButton);
