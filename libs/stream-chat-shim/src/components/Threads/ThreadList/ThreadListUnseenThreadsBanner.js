"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadListUnseenThreadsBanner = void 0;
var react_1 = require("react");
var icons_1 = require("../icons");
var context_1 = require("../../../context");
var store_1 = require("../../../store");
var selector = function (nextValue) { return ({
    unseenThreadIds: nextValue.unseenThreadIds,
}); };
var ThreadListUnseenThreadsBanner = function () {
    var client = (0, context_1.useChatContext)().client;
    var unseenThreadIds = (0, store_1.useStateStore)(client.threads.state, selector).unseenThreadIds;
    if (!unseenThreadIds.length)
        return null;
    return (<div className='str-chat__unseen-threads-banner'>
      {/* TODO: translate */}
      {unseenThreadIds.length} unread threads
      <button className='str-chat__unseen-threads-banner__button' onClick={function () {
            /* TODO backend-wire-up: client.threads.reload */
        }}>
        <icons_1.Icon.Reload />
      </button>
    </div>);
};
exports.ThreadListUnseenThreadsBanner = ThreadListUnseenThreadsBanner;
