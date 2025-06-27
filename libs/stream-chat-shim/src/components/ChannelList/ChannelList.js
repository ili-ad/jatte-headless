"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _d;
var _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelList = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var useConnectionRecoveredListener = function () { };
var useMobileNavigation = function (_a, _b, _c) { };
var usePaginatedChannels = function (_client, _filters, _sort, _options, _handler, _recoveryThrottleIntervalMs, _customQueryChannels) { return ({ channels: [], hasNextPage: false, loadNextPage: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_d) {
        return [2 /*return*/];
    }); }); }, setChannels: function () { } }); };
// import {
//   useChannelListShape,
//   usePrepareShapeHandlers,
var useChannelListShape = function (_handler) { };
var usePrepareShapeHandlers = function (_opts) { return ({ customHandler: undefined, defaultHandler: undefined }); };
var useStateStore = function (_store, _selector) { return ({ searchIsActive: false }); };
var ChannelListMessenger = function (_props) { return <div />; };
var DefaultAvatar = function (_props) { return null; };
var ChannelPreview = function (_props) { return null; };
var DefaultChannelSearch = function (_props) { return null; };
var DefaultEmptyStateIndicator = function (_props) { return null; };
var LoadingChannels = function () { return null; };
var LoadMorePaginator = function (_props) { return <></>; };
// import {
//   ChannelListContextProvider,
//   useChatContext,
//   useComponentContext,
var ChannelListContextProvider = function (props) { return <>{props.children}</>; };
var useChatContext = function (_name) { return ({
    channel: undefined,
    channelsQueryState: {},
    client: {},
    closeMobileNav: function () { },
    customClasses: {},
    navOpen: false,
    searchController: { state: {} },
    setActiveChannel: function () { },
    theme: '',
    useImageFlagEmojisOnWindows: false,
}); };
var useComponentContext = function () { return ({ Search: null }); };
var NullComponent = function () { return null; };
var utils_1 = require("./utils");
var DEFAULT_FILTERS = {};
var DEFAULT_OPTIONS = {};
var DEFAULT_SORT = {};
var searchControllerStateSelector = function (nextValue) { return ({
    searchIsActive: nextValue.isActive,
}); };
var UnMemoizedChannelList = function (props) {
    var additionalChannelSearchProps = props.additionalChannelSearchProps, _d = props.allowNewMessagesFromUnfilteredChannels, allowNewMessagesFromUnfilteredChannels = _d === void 0 ? true : _d, _e = props.Avatar, Avatar = _e === void 0 ? DefaultAvatar : _e, channelRenderFilterFn = props.channelRenderFilterFn, _f = props.ChannelSearch, ChannelSearch = _f === void 0 ? DefaultChannelSearch : _f, customActiveChannel = props.customActiveChannel, customQueryChannels = props.customQueryChannels, _g = props.EmptyStateIndicator, EmptyStateIndicator = _g === void 0 ? DefaultEmptyStateIndicator : _g, _h = props.filters, filters = _h === void 0 ? {} : _h, getLatestMessagePreview = props.getLatestMessagePreview, _j = props.List, List = _j === void 0 ? ChannelListMessenger : _j, _k = props.LoadingErrorIndicator, LoadingErrorIndicator = _k === void 0 ? NullComponent : _k, _l = props.LoadingIndicator, LoadingIndicator = _l === void 0 ? LoadingChannels : _l, _m = props.lockChannelOrder, lockChannelOrder = _m === void 0 ? false : _m, onAddedToChannel = props.onAddedToChannel, onChannelDeleted = props.onChannelDeleted, onChannelHidden = props.onChannelHidden, onChannelTruncated = props.onChannelTruncated, onChannelUpdated = props.onChannelUpdated, onChannelVisible = props.onChannelVisible, onMessageNew = props.onMessageNew, onMessageNewHandler = props.onMessageNewHandler, onRemovedFromChannel = props.onRemovedFromChannel, options = props.options, _o = props.Paginator, Paginator = _o === void 0 ? LoadMorePaginator : _o, Preview = props.Preview, recoveryThrottleIntervalMs = props.recoveryThrottleIntervalMs, renderChannels = props.renderChannels, _p = props.sendChannelsToList, sendChannelsToList = _p === void 0 ? false : _p, _q = props.setActiveChannelOnMount, setActiveChannelOnMount = _q === void 0 ? true : _q, _r = props.showChannelSearch, showChannelSearch = _r === void 0 ? false : _r, _s = props.sort, sort = _s === void 0 ? DEFAULT_SORT : _s, _t = props.watchers, watchers = _t === void 0 ? {} : _t;
    var _u = useChatContext('ChannelList'), channel = _u.channel, channelsQueryState = _u.channelsQueryState, client = _u.client, closeMobileNav = _u.closeMobileNav, customClasses = _u.customClasses, _v = _u.navOpen, navOpen = _v === void 0 ? false : _v, searchController = _u.searchController, setActiveChannel = _u.setActiveChannel, theme = _u.theme, useImageFlagEmojisOnWindows = _u.useImageFlagEmojisOnWindows;
    var Search = useComponentContext().Search; // FIXME: us component context to retrieve ChannelPreview UI components too
    var channelListRef = (0, react_1.useRef)(null);
    var _w = (0, react_1.useState)(0), channelUpdateCount = _w[0], setChannelUpdateCount = _w[1];
    var _x = (0, react_1.useState)(false), searchActive = _x[0], setSearchActive = _x[1];
    // Indicator relevant when Search component that relies on SearchController is used
    var searchIsActive = useStateStore(searchController.state, searchControllerStateSelector).searchIsActive;
    /**
     * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
     * If customActiveChannel prop is absent, then set the first channel in list as active channel.
     */
    var activeChannelHandler = function (channels, setChannels) { return __awaiter(void 0, void 0, void 0, function () {
        var customActiveChannelObject;
        return __generator(this, function (_d) {
            if (!channels.length ||
                channels.length > ((options === null || options === void 0 ? void 0 : options.limit) || utils_1.MAX_QUERY_CHANNELS_LIMIT)) {
                return [2 /*return*/];
            }
            if (customActiveChannel) {
                customActiveChannelObject = channels.find(function (chan) { return chan.id === customActiveChannel; });
                if (!customActiveChannelObject) {
                    {
                        id: customActiveChannel;
                    }
                    as;
                    Channel,
                    ;
                }
            }
            return [2 /*return*/];
        });
    }); };
};
;
if (customActiveChannelObject) {
    setActiveChannel(customActiveChannelObject, watchers);
    var newChannels = (0, utils_1.moveChannelUpwards)({
        channels: channels,
        channelToMove: customActiveChannelObject,
        sort: sort,
    });
    setChannels(newChannels);
}
return;
if (setActiveChannelOnMount) {
    setActiveChannel(channels[0], watchers);
}
;
/**
 * For some events, inner properties on the channel will update but the shallow comparison will not
 * force a re-render. Incrementing this dummy variable ensures the channel previews update.
 */
var forceUpdate = (0, react_1.useCallback)(function () { return setChannelUpdateCount(function (count) { return count + 1; }); }, []);
var onSearch = (0, react_1.useCallback)(function (event) {
    var _d;
    setSearchActive(!!event.target.value);
    (_d = additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.onSearch) === null || _d === void 0 ? void 0 : _d.call(additionalChannelSearchProps, event);
}, [additionalChannelSearchProps]);
var onSearchExit = (0, react_1.useCallback)(function () {
    var _d;
    setSearchActive(false);
    (_d = additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.onSearchExit) === null || _d === void 0 ? void 0 : _d.call(additionalChannelSearchProps);
}, [additionalChannelSearchProps]);
var _g = usePaginatedChannels(client, filters || DEFAULT_FILTERS, sort || DEFAULT_SORT, options || DEFAULT_OPTIONS, activeChannelHandler, recoveryThrottleIntervalMs, customQueryChannels), channels = _g.channels, hasNextPage = _g.hasNextPage, loadNextPage = _g.loadNextPage, setChannels = _g.setChannels;
var loadedChannels = channelRenderFilterFn
    ? channelRenderFilterFn(channels)
    : channels;
useMobileNavigation(channelListRef, navOpen, closeMobileNav);
var _h = usePrepareShapeHandlers({
    allowNewMessagesFromUnfilteredChannels: allowNewMessagesFromUnfilteredChannels,
    filters: filters,
    lockChannelOrder: lockChannelOrder,
    onAddedToChannel: onAddedToChannel,
    onChannelDeleted: onChannelDeleted,
    onChannelHidden: onChannelHidden,
    onChannelTruncated: onChannelTruncated,
    onChannelUpdated: onChannelUpdated,
    onChannelVisible: onChannelVisible,
    onMessageNew: onMessageNew,
    onMessageNewHandler: onMessageNewHandler,
    onRemovedFromChannel: onRemovedFromChannel,
    setChannels: setChannels,
    sort: sort,
    // TODO: implement
    // customHandleChannelListShape
}), customHandler = _h.customHandler, defaultHandler = _h.defaultHandler;
useChannelListShape(customHandler !== null && customHandler !== void 0 ? customHandler : defaultHandler);
// TODO: maybe move this too
useConnectionRecoveredListener(forceUpdate);
(0, react_1.useEffect)(function () {
    var handleEvent = function (event) {
        if (event.cid === (channel === null || channel === void 0 ? void 0 : channel.cid)) {
            setActiveChannel();
        }
    };
    /* TODO backend-wire-up: client.on */
    /* TODO backend-wire-up: client.on */
    return function () {
        /* TODO backend-wire-up: client.off */
        /* TODO backend-wire-up: client.off */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [channel === null || channel === void 0 ? void 0 : channel.cid]);
var renderChannel = function (item) {
    var previewProps = {
        activeChannel: channel,
        Avatar: Avatar,
        channel: item,
        // forces the update of preview component on channel update
        channelUpdateCount: channelUpdateCount,
        getLatestMessagePreview: getLatestMessagePreview,
        key: item.cid,
        Preview: Preview,
        setActiveChannel: setActiveChannel,
        watchers: watchers,
    };
    return <ChannelPreview {...previewProps}/>;
};
var baseClass = 'str-chat__channel-list';
var className = (0, clsx_1.default)((_e = customClasses === null || customClasses === void 0 ? void 0 : customClasses.chat) !== null && _e !== void 0 ? _e : 'str-chat', theme, (_f = customClasses === null || customClasses === void 0 ? void 0 : customClasses.channelList) !== null && _f !== void 0 ? _f : "".concat(baseClass, " ").concat(baseClass, "-react"), (_d = {
        'str-chat--windows-flags': useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
    },
    _d["".concat(baseClass, "--open")] = navOpen,
    _d));
var showChannelList = (!searchActive && !searchIsActive) || (additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.popupResults);
return (<ChannelListContextProvider value={{ channels: channels, hasNextPage: hasNextPage, loadNextPage: loadNextPage, setChannels: setChannels }}>
      <div className={className} ref={channelListRef}>
        {showChannelSearch &&
        (Search ? (<Search directMessagingChannelType={additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.channelType} disabled={additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.disabled} exitSearchOnInputBlur={additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.clearSearchOnClickOutside} placeholder={additionalChannelSearchProps === null || additionalChannelSearchProps === void 0 ? void 0 : additionalChannelSearchProps.placeholder}/>) : (<ChannelSearch onSearch={onSearch} onSearchExit={onSearchExit} setChannels={setChannels} {...additionalChannelSearchProps}/>))}
        {showChannelList && (<List error={channelsQueryState.error} loadedChannels={sendChannelsToList ? loadedChannels : undefined} loading={!!channelsQueryState.queryInProgress &&
            ['reload', 'uninitialized'].includes(channelsQueryState.queryInProgress)} LoadingErrorIndicator={LoadingErrorIndicator} LoadingIndicator={LoadingIndicator} setChannels={setChannels}>
            {!(loadedChannels === null || loadedChannels === void 0 ? void 0 : loadedChannels.length) ? (<EmptyStateIndicator listType='channel'/>) : (<Paginator hasNextPage={hasNextPage} isLoading={channelsQueryState.queryInProgress === 'load-more'} loadNextPage={loadNextPage}>
                {renderChannels
                ? renderChannels(loadedChannels, renderChannel)
                : loadedChannels.map(function (channel) { return renderChannel(channel); })}
              </Paginator>)}
          </List>)}
      </div>
    </ChannelListContextProvider>);
;
/**
 * Renders a preview list of Channels, allowing you to select the Channel you want to open
 */
exports.ChannelList = react_1.default.memo(UnMemoizedChannelList);
