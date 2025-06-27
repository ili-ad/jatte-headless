"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStatus = void 0;
var react_1 = require("react");
var CustomNotification_1 = require("./CustomNotification");
var context_1 = require("../../context");
var UnMemoizedConnectionStatus = function () {
    var client = (0, context_1.useChatContext)('ConnectionStatus').client;
    var t = (0, context_1.useTranslationContext)('ConnectionStatus').t;
    var _a = (0, react_1.useState)(true), online = _a[0], setOnline = _a[1];
    (0, react_1.useEffect)(function () {
        var connectionChanged = function (_a) {
            var _b = _a.online, onlineStatus = _b === void 0 ? false : _b;
            if (online !== onlineStatus) {
                setOnline(onlineStatus);
            }
        };
        client.on('connection.changed', connectionChanged);
        return function () { return client.off('connection.changed', connectionChanged); };
    }, [client, online]);
    return (<CustomNotification_1.CustomNotification active={!online} className='str-chat__connection-status-notification' type='error'>
      {t('Connection failure, reconnecting now...')}
    </CustomNotification_1.CustomNotification>);
};
exports.ConnectionStatus = react_1.default.memo(UnMemoizedConnectionStatus);
