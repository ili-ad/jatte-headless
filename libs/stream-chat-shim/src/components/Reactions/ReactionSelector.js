"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionSelector = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var Avatar_1 = require("../Avatar");
var Dialog_1 = require("../Dialog");
var reactionOptions_1 = require("./reactionOptions");
var utils_1 = require("./utils/utils");
var useComponentContext = function (_componentName) { return ({
    Avatar: Avatar_1.Avatar,
    reactionOptions: reactionOptions_1.defaultReactionOptions,
}); };
var useMessageContext = function (_componentName) { return ({
    closeReactionSelectorOnClick: false,
    handleReaction: function () { return Promise.resolve(); },
    message: { id: '' },
}); };
var UnMemoizedReactionSelector = function (props) {
    var _a;
    var propAvatar = props.Avatar, _b = props.detailedView, detailedView = _b === void 0 ? true : _b, propHandleReaction = props.handleReaction, propLatestReactions = props.latest_reactions, propOwnReactions = props.own_reactions, propReactionGroups = props.reaction_groups, propReactionOptions = props.reactionOptions, _c = props.reverse, reverse = _c === void 0 ? false : _c;
    var _d = useComponentContext('ReactionSelector'), contextAvatar = _d.Avatar, _e = _d.reactionOptions, contextReactionOptions = _e === void 0 ? reactionOptions_1.defaultReactionOptions : _e;
    var _f = useMessageContext('ReactionSelector'), closeReactionSelectorOnClick = _f.closeReactionSelectorOnClick, contextHandleReaction = _f.handleReaction, message = _f.message;
    var dialogId = "reaction-selector--".concat(message.id);
    var dialog = (0, Dialog_1.useDialog)({ id: dialogId });
    var reactionOptions = propReactionOptions !== null && propReactionOptions !== void 0 ? propReactionOptions : contextReactionOptions;
    var Avatar = propAvatar || contextAvatar || Avatar_1.Avatar;
    var handleReaction = propHandleReaction || contextHandleReaction;
    var latestReactions = propLatestReactions || (message === null || message === void 0 ? void 0 : message.latest_reactions) || [];
    var ownReactions = propOwnReactions || (message === null || message === void 0 ? void 0 : message.own_reactions) || [];
    var reactionGroups = propReactionGroups || (message === null || message === void 0 ? void 0 : message.reaction_groups) || {};
    var _g = (0, react_1.useState)(null), tooltipReactionType = _g[0], setTooltipReactionType = _g[1];
    var _h = (0, react_1.useState)(null), tooltipPositions = _h[0], setTooltipPositions = _h[1];
    var rootRef = (0, react_1.useRef)(null);
    var targetRef = (0, react_1.useRef)(null);
    var tooltipRef = (0, react_1.useRef)(null);
    var showTooltip = (0, react_1.useCallback)(function (event, reactionType) {
        targetRef.current = event.currentTarget;
        setTooltipReactionType(reactionType);
    }, []);
    var hideTooltip = (0, react_1.useCallback)(function () {
        setTooltipReactionType(null);
        setTooltipPositions(null);
    }, []);
    (0, react_1.useEffect)(function () {
        var _a, _b, _c;
        if (!tooltipReactionType || !rootRef.current)
            return;
        var tooltip = (_a = tooltipRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        var target = (_b = targetRef.current) === null || _b === void 0 ? void 0 : _b.getBoundingClientRect();
        var container = (0, utils_1.isMutableRef)(rootRef)
            ? (_c = rootRef.current) === null || _c === void 0 ? void 0 : _c.getBoundingClientRect()
            : null;
        if (!tooltip || !target || !container)
            return;
        var tooltipPosition = tooltip.width === container.width || tooltip.x < container.x
            ? 0
            : target.left + target.width / 2 - container.left - tooltip.width / 2;
        var arrowPosition = target.x - tooltip.x + target.width / 2 - tooltipPosition;
        setTooltipPositions({
            arrow: arrowPosition,
            tooltip: tooltipPosition,
        });
    }, [tooltipReactionType, rootRef]);
    var getUsersPerReactionType = function (type) {
        return latestReactions
            .map(function (reaction) {
            var _a, _b;
            if (reaction.type === type) {
                return ((_a = reaction.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = reaction.user) === null || _b === void 0 ? void 0 : _b.id);
            }
            return null;
        })
            .filter(Boolean);
    };
    var iHaveReactedWithReaction = function (reactionType) {
        return ownReactions.find(function (reaction) { return reaction.type === reactionType; });
    };
    var getLatestUserForReactionType = function (type) {
        var _a;
        return ((_a = latestReactions.find(function (reaction) { return reaction.type === type && !!reaction.user; })) === null || _a === void 0 ? void 0 : _a.user) ||
            undefined;
    };
    return (<div className={(0, clsx_1.default)('str-chat__reaction-selector str-chat__message-reaction-selector str-chat-react__message-reaction-selector', {
            'str-chat__reaction-selector--reverse': reverse,
        })} data-testid='reaction-selector' ref={rootRef}>
      {!!tooltipReactionType && detailedView && (<div className='str-chat__reaction-selector-tooltip' ref={tooltipRef} style={{
                left: tooltipPositions === null || tooltipPositions === void 0 ? void 0 : tooltipPositions.tooltip,
                visibility: tooltipPositions ? 'visible' : 'hidden',
            }}>
          <div className='arrow' style={{ left: tooltipPositions === null || tooltipPositions === void 0 ? void 0 : tooltipPositions.arrow }}/>
          {(_a = getUsersPerReactionType(tooltipReactionType)) === null || _a === void 0 ? void 0 : _a.map(function (user, i, users) { return (<span className='latest-user-username' key={"key-".concat(i, "-").concat(user)}>
              {"".concat(user).concat(i < users.length - 1 ? ', ' : '')}
            </span>); })}
        </div>)}
      <ul className='str-chat__message-reactions-list str-chat__message-reactions-options'>
        {reactionOptions.map(function (_a) {
            var _b, _c;
            var Component = _a.Component, reactionName = _a.name, reactionType = _a.type;
            var latestUser = getLatestUserForReactionType(reactionType);
            var count = (_c = (_b = reactionGroups[reactionType]) === null || _b === void 0 ? void 0 : _b.count) !== null && _c !== void 0 ? _c : 0;
            return (<li key={reactionType}>
              <button aria-label={"Select Reaction: ".concat(reactionName || reactionType)} className={(0, clsx_1.default)('str-chat__message-reactions-list-item str-chat__message-reactions-option', {
                    'str-chat__message-reactions-option-selected': iHaveReactedWithReaction(reactionType),
                })} data-testid='select-reaction-button' data-text={reactionType} onClick={function (event) {
                    handleReaction(reactionType, event);
                    if (closeReactionSelectorOnClick) {
                        dialog.close();
                    }
                }}>
                {!!count && detailedView && (<div className='latest-user str-chat__message-reactions-last-user' onClick={hideTooltip} onMouseEnter={function (e) { return showTooltip(e, reactionType); }} onMouseLeave={hideTooltip}>
                    {latestUser ? (<Avatar image={latestUser.image} name={latestUser.name} size={20} user={latestUser}/>) : (<div className='latest-user-not-found'/>)}
                  </div>)}
                <span className='str-chat__message-reaction-emoji'>
                  <Component />
                </span>
                {Boolean(count) && detailedView && (<span className='str-chat__message-reactions-list-item__count'>
                    {count || ''}
                  </span>)}
              </button>
            </li>);
        })}
      </ul>
    </div>);
};
/**
 * Component that allows a user to select a reaction.
 */
exports.ReactionSelector = react_1.default.memo(UnMemoizedReactionSelector);
