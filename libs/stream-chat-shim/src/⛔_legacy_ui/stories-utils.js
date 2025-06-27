"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedUser = exports.streamAPIKey = void 0;
var react_1 = require("react");
var stream_chat_1 = require("stream-chat");
var Chat_1 = require("./Chat");
var appKey = process.env.NEXT_PUBLIC_STREAM_KEY;
if (!appKey) {
    throw new Error('expected APP_KEY');
}
exports.streamAPIKey = appKey;
var useClient = function (_a) {
    var apiKey = _a.apiKey, tokenOrProvider = _a.tokenOrProvider, userData = _a.userData;
    var _b = (0, react_1.useState)(null), chatClient = _b[0], setChatClient = _b[1];
    (0, react_1.useEffect)(function () {
        var client = new stream_chat_1.StreamChat(apiKey);
        var didUserConnectInterrupt = false;
        var connectionPromise = client.connectUser(userData, tokenOrProvider).then(function () {
            if (!didUserConnectInterrupt)
                setChatClient(client);
        });
        return function () {
            didUserConnectInterrupt = true;
            setChatClient(null);
            connectionPromise
                .then(function () { return client.disconnectUser(); })
                .then(function () {
                console.log('connection closed');
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, userData.id, tokenOrProvider]);
    return chatClient;
};
var ConnectedUser = function (_a) {
    var children = _a.children, token = _a.token, userId = _a.userId;
    var client = useClient({
        apiKey: exports.streamAPIKey,
        tokenOrProvider: token,
        userData: { id: userId },
    });
    if (!client) {
        return <p>Waiting for connection to be established with user: {userId}...</p>;
    }
    return (<>
      <h3>User: {userId}</h3>
      <div className="chat-wrapper">
        <Chat_1.Chat client={client}>{children}</Chat_1.Chat>
      </div>
    </>);
};
exports.ConnectedUser = ConnectedUser;
