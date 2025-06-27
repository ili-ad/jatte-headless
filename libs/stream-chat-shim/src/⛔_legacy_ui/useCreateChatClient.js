"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCreateChatClient = void 0;
var react_1 = require("react");
var stream_chat_1 = require("stream-chat");
/**
 * React hook to create, connect and return `StreamChat` client.
 */
var useCreateChatClient = function (_a) {
    var apiKey = _a.apiKey, options = _a.options, tokenOrProvider = _a.tokenOrProvider, userData = _a.userData;
    var _b = (0, react_1.useState)(null), chatClient = _b[0], setChatClient = _b[1];
    var _c = (0, react_1.useState)(userData), cachedUserData = _c[0], setCachedUserData = _c[1];
    if (userData.id !== cachedUserData.id) {
        setCachedUserData(userData);
    }
    var cachedOptions = (0, react_1.useState)(options)[0];
    (0, react_1.useEffect)(function () {
        var client = new stream_chat_1.StreamChat(apiKey, undefined, cachedOptions);
        var didUserConnectInterrupt = false;
        var connectionPromise = client
            .connectUser(cachedUserData, tokenOrProvider)
            .then(function () {
            if (!didUserConnectInterrupt)
                setChatClient(client);
        });
        return function () {
            didUserConnectInterrupt = true;
            setChatClient(null);
            connectionPromise
                .then(function () { return client.disconnectUser(); })
                .then(function () {
                console.log("Connection for user \"".concat(cachedUserData.id, "\" has been closed"));
            });
        };
    }, [apiKey, cachedUserData, cachedOptions, tokenOrProvider]);
    return chatClient;
};
exports.useCreateChatClient = useCreateChatClient;
