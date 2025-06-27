"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionsList = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var ReactionsListModal_1 = require("./ReactionsListModal");
var useProcessReactions_1 = require("./hooks/useProcessReactions");
var context_1 = require("../../context");
var MAX_MESSAGE_REACTIONS_TO_FETCH = 1000;
var UnMemoizedReactionsList = function (props) {
    var handleFetchReactions = props.handleFetchReactions, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reactionDetailsSort = props.reactionDetailsSort, _a = props.reverse, reverse = _a === void 0 ? false : _a, sortReactionDetails = props.sortReactionDetails, rest = __rest(props, ["handleFetchReactions", "reactionDetailsSort", "reverse", "sortReactionDetails"]);
    var _b = (0, useProcessReactions_1.useProcessReactions)(rest), existingReactions = _b.existingReactions, hasReactions = _b.hasReactions, totalReactionCount = _b.totalReactionCount;
    var _c = (0, react_1.useState)(null), selectedReactionType = _c[0], setSelectedReactionType = _c[1];
    var t = (0, context_1.useTranslationContext)('ReactionsList').t;
    var _d = (0, context_1.useComponentContext)().ReactionsListModal, ReactionsListModal = _d === void 0 ? ReactionsListModal_1.ReactionsListModal : _d;
    var handleReactionButtonClick = function (reactionType) {
        if (totalReactionCount > MAX_MESSAGE_REACTIONS_TO_FETCH) {
            return;
        }
        setSelectedReactionType(reactionType);
    };
    if (!hasReactions)
        return null;
    return (<>
      <div aria-label={t('aria/Reaction list')} className={(0, clsx_1.default)('str-chat__reaction-list str-chat__message-reactions-container', {
            // we are stuck with both classes as both are used in CSS
            'str-chat__reaction-list--reverse': reverse,
        })} data-testid='reaction-list' role='figure'>
        <ul className='str-chat__message-reactions'>
          {existingReactions.map(function (_a) {
            var EmojiComponent = _a.EmojiComponent, isOwnReaction = _a.isOwnReaction, reactionCount = _a.reactionCount, reactionType = _a.reactionType;
            return EmojiComponent && (<li className={(0, clsx_1.default)('str-chat__message-reaction', {
                    'str-chat__message-reaction-own': isOwnReaction,
                })} key={reactionType}>
                  <button aria-label={"Reactions: ".concat(reactionType)} data-testid={"reactions-list-button-".concat(reactionType)} onClick={function () { return handleReactionButtonClick(reactionType); }} type='button'>
                    <span className='str-chat__message-reaction-emoji'>
                      <EmojiComponent />
                    </span>
                    &nbsp;
                    <span className='str-chat__message-reaction-count' data-testclass='reaction-list-reaction-count'>
                      {reactionCount}
                    </span>
                  </button>
                </li>);
        })}
          <li>
            <span className='str-chat__reaction-list--counter'>{totalReactionCount}</span>
          </li>
        </ul>
      </div>
      {selectedReactionType !== null && (<ReactionsListModal handleFetchReactions={handleFetchReactions} onClose={function () { return setSelectedReactionType(null); }} onSelectedReactionTypeChange={setSelectedReactionType} open={selectedReactionType !== null} reactions={existingReactions} selectedReactionType={selectedReactionType} sortReactionDetails={sortReactionDetails}/>)}
    </>);
};
/**
 * Component that displays a list of reactions on a message.
 */
exports.ReactionsList = react_1.default.memo(UnMemoizedReactionsList);
