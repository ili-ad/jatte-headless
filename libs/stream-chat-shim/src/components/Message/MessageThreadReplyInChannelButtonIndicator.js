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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageThreadReplyInChannelButtonIndicator = void 0;
var react_1 = require("react");
var formatMessage = function (m) { return m; };
var context_1 = require("../../context");
var MessageThreadReplyInChannelButtonIndicator = function () {
    var client = (0, context_1.useChatContext)().client;
    var t = (0, context_1.useTranslationContext)().t;
    var channel = (0, context_1.useChannelStateContext)().channel;
    var openThread = (0, context_1.useChannelActionContext)().openThread;
    var message = (0, context_1.useMessageContext)().message;
    var parentMessageRef = (0, react_1.useRef)(undefined);
    var querySearchParent = function () {
        return Promise.resolve({
            /* TODO backend-wire-up: search */
            results: []
        })
            .then(function (_a) {
            var results = _a.results;
            if (!results.length) {
                throw new Error('Thread has not been found');
            }
            parentMessageRef.current = formatMessage(results[0].message);
        })
            .catch(function (error) {
            /* TODO backend-wire-up: addError */
        });
    };
    (0, react_1.useEffect)(function () {
        if (parentMessageRef.current ||
            parentMessageRef.current === null ||
            !message.parent_id)
            return;
        var localMessage = undefined; /* TODO backend-wire-up: findMessage */
        if (localMessage) {
            parentMessageRef.current = localMessage;
            return;
        }
    }, [channel, message]);
    if (!message.parent_id)
        return null;
    return (<div className='str-chat__message-is-thread-reply-button-wrapper'>
      <button className='str-chat__message-is-thread-reply-button' data-testid='message-is-thread-reply-button' onClick={function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!parentMessageRef.current) return [3 /*break*/, 2];
                        // search query is performed here in order to prevent multiple search queries in useEffect
                        // due to the message list 3x remounting its items
                        return [4 /*yield*/, querySearchParent()];
                    case 1:
                        // search query is performed here in order to prevent multiple search queries in useEffect
                        // due to the message list 3x remounting its items
                        _a.sent();
                        if (parentMessageRef.current) {
                            openThread(parentMessageRef.current);
                        }
                        else {
                            // prevent further search queries if the message is not found in the DB
                            parentMessageRef.current = null;
                        }
                        return [2 /*return*/];
                    case 2:
                        openThread(parentMessageRef.current);
                        return [2 /*return*/];
                }
            });
        }); }} type='button'>
        {t('Thread reply')}
      </button>
    </div>);
};
exports.MessageThreadReplyInChannelButtonIndicator = MessageThreadReplyInChannelButtonIndicator;
exports.default = exports.MessageThreadReplyInChannelButtonIndicator;
