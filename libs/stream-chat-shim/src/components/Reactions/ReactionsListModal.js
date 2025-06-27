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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionsListModal = ReactionsListModal;
var react_1 = require("react");
var clsx_1 = require("clsx");
var Modal_1 = require("../Modal");
var useFetchReactions_1 = require("./hooks/useFetchReactions");
var Loading_1 = require("../Loading");
var Avatar_1 = require("../Avatar");
var useMessageContext = function (_) { return ({}); };
var defaultReactionDetailsSort = { created_at: -1 };
function ReactionsListModal(_a) {
    var _b, _c;
    var handleFetchReactions = _a.handleFetchReactions, onSelectedReactionTypeChange = _a.onSelectedReactionTypeChange, propReactionDetailsSort = _a.reactionDetailsSort, reactions = _a.reactions, selectedReactionType = _a.selectedReactionType, propSortReactionDetails = _a.sortReactionDetails, modalProps = __rest(_a, ["handleFetchReactions", "onSelectedReactionTypeChange", "reactionDetailsSort", "reactions", "selectedReactionType", "sortReactionDetails"]);
    var selectedReaction = reactions.find(function (_a) {
        var reactionType = _a.reactionType;
        return reactionType === selectedReactionType;
    });
    var SelectedEmojiComponent = (_b = selectedReaction === null || selectedReaction === void 0 ? void 0 : selectedReaction.EmojiComponent) !== null && _b !== void 0 ? _b : null;
    var _d = useMessageContext('ReactionsListModal'), contextReactionDetailsSort = _d.reactionDetailsSort, contextSortReactionDetails = _d.sortReactionDetails;
    var legacySortReactionDetails = propSortReactionDetails !== null && propSortReactionDetails !== void 0 ? propSortReactionDetails : contextSortReactionDetails;
    var reactionDetailsSort = (_c = propReactionDetailsSort !== null && propReactionDetailsSort !== void 0 ? propReactionDetailsSort : contextReactionDetailsSort) !== null && _c !== void 0 ? _c : defaultReactionDetailsSort;
    var _e = (0, useFetchReactions_1.useFetchReactions)({
        handleFetchReactions: handleFetchReactions,
        reactionType: selectedReactionType,
        shouldFetch: modalProps.open,
        sort: reactionDetailsSort,
    }), areReactionsLoading = _e.isLoading, reactionDetails = _e.reactions;
    var reactionDetailsWithLegacyFallback = (0, react_1.useMemo)(function () {
        return legacySortReactionDetails
            ? __spreadArray([], reactionDetails, true).sort(legacySortReactionDetails)
            : reactionDetails;
    }, [legacySortReactionDetails, reactionDetails]);
    return (<Modal_1.Modal {...modalProps} className={(0, clsx_1.default)('str-chat__message-reactions-details-modal', modalProps.className)}>
      <div className='str-chat__message-reactions-details' data-testid='reactions-list-modal'>
        <div className='str-chat__message-reactions-details-reaction-types'>
          {reactions.map(function (_a) {
            var EmojiComponent = _a.EmojiComponent, reactionCount = _a.reactionCount, reactionType = _a.reactionType;
            return EmojiComponent && (<div className={(0, clsx_1.default)('str-chat__message-reactions-details-reaction-type', {
                    'str-chat__message-reactions-details-reaction-type--selected': selectedReactionType === reactionType,
                })} data-testid={"reaction-details-selector-".concat(reactionType)} key={reactionType} onClick={function () {
                    return onSelectedReactionTypeChange === null || onSelectedReactionTypeChange === void 0 ? void 0 : onSelectedReactionTypeChange(reactionType);
                }}>
                  <span className='str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback'>
                    <EmojiComponent />
                  </span>
                  &nbsp;
                  <span className='str-chat__message-reaction-count'>
                    {reactionCount}
                  </span>
                </div>);
        })}
        </div>
        {SelectedEmojiComponent && (<div className='str-chat__message-reaction-emoji str-chat__message-reaction-emoji--with-fallback str-chat__message-reaction-emoji-big'>
            <SelectedEmojiComponent />
          </div>)}
        <div className='str-chat__message-reactions-details-reacting-users' data-testid='all-reacting-users'>
          {areReactionsLoading ? (<Loading_1.LoadingIndicator />) : (reactionDetailsWithLegacyFallback.map(function (_a) {
            var user = _a.user;
            return (<div className='str-chat__message-reactions-details-reacting-user' key={user === null || user === void 0 ? void 0 : user.id}>
                <Avatar_1.Avatar className='stream-chat__avatar--reaction' data-testid='avatar' image={user === null || user === void 0 ? void 0 : user.image} name={(user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.id)}/>
                <span className='str-chat__user-item--name' data-testid='reaction-user-username'>
                  {(user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.id)}
                </span>
              </div>);
        }))}
        </div>
      </div>
    </Modal_1.Modal>);
}
