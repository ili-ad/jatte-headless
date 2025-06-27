"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisplayImage = exports.getDisplayTitle = exports.getGroupChannelDisplayInfo = exports.getLatestMessagePreview = exports.renderPreviewText = void 0;
var react_1 = require("react");
var react_markdown_1 = require("react-markdown");
var renderPreviewText = function (text) { return (<react_markdown_1.default skipHtml>{text}</react_markdown_1.default>); };
exports.renderPreviewText = renderPreviewText;
var getLatestPollVote = function (latestVotesByOption) {
    var latestVote;
    for (var _i = 0, _a = Object.values(latestVotesByOption); _i < _a.length; _i++) {
        var optionVotes = _a[_i];
        optionVotes.forEach(function (vote) {
            if (latestVote && new Date(latestVote.updated_at) >= new Date(vote.created_at))
                return;
            latestVote = vote;
        });
    }
    return latestVote;
};
var getLatestMessagePreview = function (channel, t, userLanguage, isMessageAIGenerated) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (userLanguage === void 0) { userLanguage = 'en'; }
    var latestMessage = channel.state.latestMessages[channel.state.latestMessages.length - 1];
    var previewTextToRender = ((_a = latestMessage === null || latestMessage === void 0 ? void 0 : latestMessage.i18n) === null || _a === void 0 ? void 0 : _a["".concat(userLanguage, "_text")]) ||
        (latestMessage === null || latestMessage === void 0 ? void 0 : latestMessage.text);
    var poll = latestMessage === null || latestMessage === void 0 ? void 0 : latestMessage.poll;
    if (!latestMessage) {
        return t('Nothing yet...');
    }
    if (latestMessage.deleted_at) {
        return t('Message deleted');
    }
    if (poll) {
        if (!poll.vote_count) {
            var createdBy = ((_b = poll.created_by) === null || _b === void 0 ? void 0 : _b.id) === channel.getClient().userID
                ? t('You')
                : ((_d = (_c = poll.created_by) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : t('Poll'));
            return t('📊 {{createdBy}} created: {{ pollName}}', {
                createdBy: createdBy,
                pollName: poll.name,
            });
        }
        else {
            var latestVote_1 = getLatestPollVote(poll.latest_votes_by_option);
            var option = latestVote_1 && poll.options.find(function (opt) { return opt.id === latestVote_1.option_id; });
            if (option && latestVote_1) {
                return t('📊 {{votedBy}} voted: {{pollOptionText}}', {
                    pollOptionText: option.text,
                    votedBy: ((_e = latestVote_1 === null || latestVote_1 === void 0 ? void 0 : latestVote_1.user) === null || _e === void 0 ? void 0 : _e.id) === channel.getClient().userID
                        ? t('You')
                        : ((_g = (_f = latestVote_1.user) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : t('Poll')),
                });
            }
        }
    }
    if (previewTextToRender) {
        return (isMessageAIGenerated === null || isMessageAIGenerated === void 0 ? void 0 : isMessageAIGenerated(latestMessage))
            ? previewTextToRender
            : (0, exports.renderPreviewText)(previewTextToRender);
    }
    if (latestMessage.command) {
        return "/".concat(latestMessage.command);
    }
    if ((_h = latestMessage.attachments) === null || _h === void 0 ? void 0 : _h.length) {
        return t('🏙 Attachment...');
    }
    return t('Empty message...');
};
exports.getLatestMessagePreview = getLatestMessagePreview;
var getGroupChannelDisplayInfo = function (channel) {
    var members = Object.values(channel.state.members);
    if (members.length <= 2)
        return;
    var info = [];
    for (var i = 0; i < members.length; i++) {
        var user = members[i].user;
        if (!(user === null || user === void 0 ? void 0 : user.name) && !(user === null || user === void 0 ? void 0 : user.image))
            continue;
        info.push({ image: user.image, name: user.name });
        if (info.length === 4)
            break;
    }
    return info;
};
exports.getGroupChannelDisplayInfo = getGroupChannelDisplayInfo;
var getChannelDisplayInfo = function (info, channel, currentUser) {
    var _a, _b;
    if ((_a = channel.data) === null || _a === void 0 ? void 0 : _a[info])
        return channel.data[info];
    var members = Object.values(channel.state.members);
    if (members.length !== 2)
        return;
    var otherMember = members.find(function (member) { var _a; return ((_a = member.user) === null || _a === void 0 ? void 0 : _a.id) !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id); });
    return (_b = otherMember === null || otherMember === void 0 ? void 0 : otherMember.user) === null || _b === void 0 ? void 0 : _b[info];
};
var getDisplayTitle = function (channel, currentUser) {
    return getChannelDisplayInfo('name', channel, currentUser);
};
exports.getDisplayTitle = getDisplayTitle;
var getDisplayImage = function (channel, currentUser) {
    return getChannelDisplayInfo('image', channel, currentUser);
};
exports.getDisplayImage = getDisplayImage;
