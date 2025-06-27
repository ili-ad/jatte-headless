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
exports.useChannelSearch = void 0;
var react_1 = require("react");
var lodash_debounce_1 = require("lodash.debounce");
var lodash_uniqby_1 = require("lodash.uniqby");
var utils_1 = require("../utils");
var ChatContext_1 = require("../../../context/ChatContext");
var useChannelSearch = function (_a) {
    var _b = _a.channelType, channelType = _b === void 0 ? 'messaging' : _b, _c = _a.clearSearchOnClickOutside, clearSearchOnClickOutside = _c === void 0 ? true : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d, onSearchCallback = _a.onSearch, onSearchExit = _a.onSearchExit, onSelectResult = _a.onSelectResult, _e = _a.searchDebounceIntervalMs, searchDebounceIntervalMs = _e === void 0 ? 300 : _e, _f = _a.searchForChannels, searchForChannels = _f === void 0 ? false : _f, _g = _a.searchForUsers, searchForUsers = _g === void 0 ? true : _g, searchFunction = _a.searchFunction, searchQueryParams = _a.searchQueryParams, setChannels = _a.setChannels;
    var _h = (0, ChatContext_1.useChatContext)('useChannelSearch'), client = _h.client, setActiveChannel = _h.setActiveChannel;
    var _j = (0, react_1.useState)(false), inputIsFocused = _j[0], setInputIsFocused = _j[1];
    var _k = (0, react_1.useState)(''), query = _k[0], setQuery = _k[1];
    var _l = (0, react_1.useState)([]), results = _l[0], setResults = _l[1];
    var _m = (0, react_1.useState)(false), searching = _m[0], setSearching = _m[1];
    var searchQueryPromiseInProgress = (0, react_1.useRef)(false);
    var shouldIgnoreQueryResults = (0, react_1.useRef)(false);
    var inputRef = (0, react_1.useRef)(null);
    var searchBarRef = (0, react_1.useRef)(null);
    var clearState = (0, react_1.useCallback)(function () {
        setQuery('');
        setResults([]);
        setSearching(false);
        shouldIgnoreQueryResults.current = searchQueryPromiseInProgress.current;
    }, []);
    var activateSearch = (0, react_1.useCallback)(function () {
        setInputIsFocused(true);
    }, []);
    var exitSearch = (0, react_1.useCallback)(function () {
        var _a;
        setInputIsFocused(false);
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.blur();
        clearState();
        onSearchExit === null || onSearchExit === void 0 ? void 0 : onSearchExit();
    }, [clearState, onSearchExit]);
    (0, react_1.useEffect)(function () {
        if (disabled)
            return;
        var clickListener = function (event) {
            var _a;
            if (!(event.target instanceof HTMLElement))
                return;
            var isInputClick = (_a = searchBarRef.current) === null || _a === void 0 ? void 0 : _a.contains(event.target);
            if (isInputClick)
                return;
            if ((inputIsFocused && !query) || clearSearchOnClickOutside) {
                exitSearch();
            }
        };
        document.addEventListener('click', clickListener);
        return function () { return document.removeEventListener('click', clickListener); };
    }, [disabled, inputIsFocused, query, exitSearch, clearSearchOnClickOutside]);
    (0, react_1.useEffect)(function () {
        if (!inputRef.current || disabled)
            return;
        var handleKeyDown = function (event) {
            if (event.key === 'Escape')
                return exitSearch();
        };
        inputRef.current.addEventListener('keydown', handleKeyDown);
        return function () {
            var _a;
            // eslint-disable-next-line react-hooks/exhaustive-deps
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled]);
    var selectResult = (0, react_1.useCallback)(function (result) { return __awaiter(void 0, void 0, void 0, function () {
        var selectedChannel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!client.userID)
                        return [2 /*return*/];
                    if (!onSelectResult) return [3 /*break*/, 2];
                    return [4 /*yield*/, onSelectResult({
                            setQuery: setQuery,
                            setResults: setResults,
                            setSearching: setSearching,
                        }, result)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    if ((0, utils_1.isChannel)(result)) {
                        setActiveChannel(result);
                        selectedChannel = result;
                    }
                    else {
                        var newChannel =
                            /* TODO backend-wire-up: client.channel */ ({});
                        /* TODO backend-wire-up: channel.watch */
                        setActiveChannel(newChannel);
                        selectedChannel = newChannel;
                    }
                    setChannels === null || setChannels === void 0 ? void 0 : setChannels(function (channels) { return (0, lodash_uniqby_1.default)(__spreadArray([selectedChannel], channels, true), 'cid'); });
                    if (clearSearchOnClickOutside) {
                        exitSearch();
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        clearSearchOnClickOutside,
        client,
        exitSearch,
        onSelectResult,
        setActiveChannel,
        setChannels,
    ]);
    var getChannels = (0, react_1.useCallback)(function (text) { return __awaiter(void 0, void 0, void 0, function () {
        var results, promises, resolved, _a, channels, users, channels, users, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!searchForChannels && !searchForUsers)
                        return [2 /*return*/];
                    results = [];
                    promises = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    if (searchForChannels) {
                        promises.push(
                            /* TODO backend-wire-up: client.queryChannels */
                            Promise.resolve([])
                        );
                    }
                    if (searchForUsers) {
                        promises.push(
                            /* TODO backend-wire-up: client.queryUsers */
                            Promise.resolve({ users: [] })
                        );
                    }
                    if (!promises.length) return [3 /*break*/, 3];
                    searchQueryPromiseInProgress.current = true;
                    return [4 /*yield*/, Promise.all(promises)];
                case 2:
                    resolved = _b.sent();
                    if (searchForChannels && searchForUsers) {
                        _a = resolved, channels = _a[0], users = _a[1].users;
                        results = __spreadArray(__spreadArray([], channels, true), users.filter(function (u) { var _a; return u.id !== ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); }), true);
                    }
                    else if (searchForChannels) {
                        channels = resolved[0];
                        results = __spreadArray([], channels, true);
                    }
                    else if (searchForUsers) {
                        users = resolved[0].users;
                        results = __spreadArray([], users.filter(function (u) { var _a; return u.id !== ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id); }), true);
                    }
                    _b.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [3 /*break*/, 5];
                case 5:
                    setSearching(false);
                    if (!shouldIgnoreQueryResults.current) {
                        setResults(results);
                    }
                    else {
                        shouldIgnoreQueryResults.current = false;
                    }
                    searchQueryPromiseInProgress.current = false;
                    return [2 /*return*/];
            }
        });
    }); }, [client, searchForChannels, searchForUsers, searchQueryParams]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    var scheduleGetChannels = (0, react_1.useCallback)((0, lodash_debounce_1.default)(getChannels, searchDebounceIntervalMs), [getChannels, searchDebounceIntervalMs]);
    var onSearch = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        if (disabled)
            return;
        if (searchFunction) {
            searchFunction({
                setQuery: setQuery,
                setResults: setResults,
                setSearching: setSearching,
            }, event);
        }
        else if (!searchForChannels && !searchForUsers) {
            return;
        }
        else if (event.target.value) {
            setSearching(true);
            setQuery(event.target.value);
            scheduleGetChannels(event.target.value);
        }
        else if (!event.target.value) {
            clearState();
            scheduleGetChannels.cancel();
        }
        onSearchCallback === null || onSearchCallback === void 0 ? void 0 : onSearchCallback(event);
    }, [
        clearState,
        disabled,
        scheduleGetChannels,
        onSearchCallback,
        searchForChannels,
        searchForUsers,
        searchFunction,
    ]);
    return {
        activateSearch: activateSearch,
        clearState: clearState,
        exitSearch: exitSearch,
        inputIsFocused: inputIsFocused,
        inputRef: inputRef,
        onSearch: onSearch,
        query: query,
        results: results,
        searchBarRef: searchBarRef,
        searching: searching,
        selectResult: selectResult,
    };
};
exports.useChannelSearch = useChannelSearch;
