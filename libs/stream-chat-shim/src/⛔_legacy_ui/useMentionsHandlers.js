"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMentionsHandlers = void 0;
var react_1 = require("react");
/**
 * Lightweight replacement for Stream's `useMentionsHandlers` hook.
 */
var useMentionsHandlers = function (onMentionsHover, onMentionsClick) {
    return (0, react_1.useCallback)(function (event, mentioned_users) {
        if ((!onMentionsHover && !onMentionsClick) ||
            !(event.target instanceof HTMLElement)) {
            return;
        }
        var target = event.target;
        var textContent = target.innerHTML.replace('*', '');
        if (textContent[0] === '@') {
            var userName_1 = textContent.replace('@', '');
            var user = mentioned_users === null || mentioned_users === void 0 ? void 0 : mentioned_users.find(function (_a) {
                var id = _a.id, name = _a.name;
                return name === userName_1 || id === userName_1;
            });
            if (onMentionsHover &&
                typeof onMentionsHover === 'function' &&
                event.type === 'mouseover') {
                onMentionsHover(event, user);
            }
            if (onMentionsClick &&
                event.type === 'click' &&
                typeof onMentionsClick === 'function') {
                onMentionsClick(event, user);
            }
        }
    }, [onMentionsClick, onMentionsHover]);
};
exports.useMentionsHandlers = useMentionsHandlers;
