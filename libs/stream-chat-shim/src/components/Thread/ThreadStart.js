"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadStart = void 0;
var react_1 = require("react");
var ChannelStateContext_1 = require("../../context/ChannelStateContext");
var TranslationContext_1 = require("../../context/TranslationContext");
var ThreadStart = function () {
    var thread = (0, ChannelStateContext_1.useChannelStateContext)('ThreadStart').thread;
    var t = (0, TranslationContext_1.useTranslationContext)('ThreadStart').t;
    if (!(thread === null || thread === void 0 ? void 0 : thread.reply_count))
        return null;
    return (<div className='str-chat__thread-start'>
      {t('replyCount', { count: thread.reply_count })}
    </div>);
};
exports.ThreadStart = ThreadStart;
