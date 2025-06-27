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
exports.SimpleReactionsList = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var useMessageContext = function () { return ({}); };
var useProcessReactions = function () { return ({
    existingReactions: [],
    hasReactions: false,
    totalReactionCount: 0,
}); };
var useEnterLeaveHandlers = function (props) { return ({
    handleEnter: function () { },
    handleLeave: function () { },
    tooltipVisible: false,
}); };
var PopperTooltip = function (_) { return null; };
var WithTooltip = function (_a) {
    var children = _a.children, onMouseEnter = _a.onMouseEnter, onMouseLeave = _a.onMouseLeave, title = _a.title;
    var _b = (0, react_1.useState)(null), referenceElement = _b[0], setReferenceElement = _b[1];
    var _c = useEnterLeaveHandlers({
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
    }), handleEnter = _c.handleEnter, handleLeave = _c.handleLeave, tooltipVisible = _c.tooltipVisible;
    return (<>
      <PopperTooltip referenceElement={referenceElement} visible={tooltipVisible}>
        {title}
      </PopperTooltip>
      <span onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={setReferenceElement}>
        {children}
      </span>
    </>);
};
var UnMemoizedSimpleReactionsList = function (props) {
    var propHandleReaction = props.handleReaction, rest = __rest(props, ["handleReaction"]);
    var contextHandleReaction = useMessageContext('SimpleReactionsList').handleReaction;
    var _a = useProcessReactions(rest), existingReactions = _a.existingReactions, hasReactions = _a.hasReactions, totalReactionCount = _a.totalReactionCount;
    var handleReaction = propHandleReaction || contextHandleReaction;
    if (!hasReactions)
        return null;
    return (<div className='str-chat__message-reactions-container'>
      <ul className='str-chat__simple-reactions-list str-chat__message-reactions' data-testid='simple-reaction-list'>
        {existingReactions.map(function (_a) {
            var EmojiComponent = _a.EmojiComponent, isOwnReaction = _a.isOwnReaction, latestReactedUserNames = _a.latestReactedUserNames, reactionType = _a.reactionType;
            var tooltipContent = latestReactedUserNames.join(', ');
            return (EmojiComponent && (<li className={(0, clsx_1.default)('str-chat__simple-reactions-list-item', {
                    'str-chat__message-reaction-own': isOwnReaction,
                })} key={reactionType} onClick={function (event) { return handleReaction(reactionType, event); }} onKeyUp={function (event) { return handleReaction(reactionType, event); }}>
                  <WithTooltip title={tooltipContent}>
                    <EmojiComponent />
                  </WithTooltip>
                </li>));
        })}
        {<li className='str-chat__simple-reactions-list-item--last-number'>
            {totalReactionCount}
          </li>}
      </ul>
    </div>);
};
exports.SimpleReactionsList = react_1.default.memo(UnMemoizedSimpleReactionsList);
