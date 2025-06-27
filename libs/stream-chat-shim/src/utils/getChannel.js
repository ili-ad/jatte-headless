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
exports.getChannel = void 0;
/**
 * prevent from duplicate invocation of channel.watch()
 * when events 'notification.message_new' and 'notification.added_to_channel' arrive at the same time
 */
var WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL = {};
/**
 * Calls channel.watch() if it was not already recently called. Waits for watch promise to resolve even if it was invoked previously.
 * @param client
 * @param members
 * @param options
 * @param type
 * @param id
 * @param channel
 */
var getChannel = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var theChannel, originalCid, queryPromise;
    var channel = _b.channel, client = _b.client, id = _b.id, members = _b.members, options = _b.options, type = _b.type;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!channel && !type) {
                    throw new Error('Channel or channel type have to be provided to query a channel.');
                }
                theChannel = channel || client.channel(type, id, { members: members });
                originalCid = (theChannel === null || theChannel === void 0 ? void 0 : theChannel.id)
                    ? theChannel.cid
                    : members && members.length
                        ? generateChannelTempCid(theChannel.type, members)
                        : undefined;
                if (!originalCid) {
                    throw new Error('Channel ID or channel members array have to be provided to query a channel.');
                }
                queryPromise = WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
                if (!queryPromise) return [3 /*break*/, 2];
                return [4 /*yield*/, queryPromise];
            case 1:
                _c.sent();
                return [3 /*break*/, 5];
            case 2:
                _c.trys.push([2, , 4, 5]);
                return [4 /*yield*/, WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid]];
            case 3:
                _c.sent();
                return [3 /*break*/, 5];
            case 4:
                delete WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/, theChannel];
        }
    });
}); };
exports.getChannel = getChannel;
// Channels created without ID need to be referenced by an identifier until the back-end generates the final ID.
var generateChannelTempCid = function (channelType, members) {
    if (!members)
        return;
    var membersStr = __spreadArray([], members, true).sort().join(',');
    return "".concat(channelType, ":!members-").concat(membersStr);
};
