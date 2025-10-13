"use strict";
var DEV_HTTP_FALLBACK = 'http://127.0.0.1:8000';
var DEV_WS_FALLBACK = 'ws://127.0.0.1:8000';
var DEV_PORT = '8000';
var trimTrailingSlash = function (value) {
    if (!value)
        return '';
    return value.replace(/\/+$/, '');
};
var readEnv = function (key) {
    if (typeof process === 'undefined')
        return undefined;
    var _a = process.env, env = _a === void 0 ? {} : _a;
    var raw = env[key];
    if (typeof raw !== 'string')
        return undefined;
    var trimmed = raw.trim();
    return trimmed ? trimmed : undefined;
};
var formatHost = function (host) {
    if (!host)
        return '127.0.0.1';
    if (host.includes(':') && !host.startsWith('[') && !host.endsWith(']')) {
        return "[".concat(host, "]");
    }
    return host;
};
var resolveApiBase = function () {
    var envValue = readEnv('NEXT_PUBLIC_API_URL');
    if (envValue) {
        return trimTrailingSlash(envValue);
    }
    if (typeof window !== 'undefined') {
        return '';
    }
    return DEV_HTTP_FALLBACK;
};
var resolveWsBase = function () {
    var envValue = readEnv('NEXT_PUBLIC_WS_URL');
    if (envValue) {
        return trimTrailingSlash(envValue);
    }
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
        var _a = window.location, protocol = _a.protocol, hostname = _a.hostname, port = _a.port;
        var secure = protocol === 'https:';
        var scheme = secure ? 'wss' : 'ws';
        var host = formatHost(hostname);
        var resolvedPort = port || DEV_PORT;
        var portSegment = resolvedPort ? ":".concat(resolvedPort) : '';
        return "".concat(scheme, "://").concat(host).concat(portSegment);
    }
    return DEV_WS_FALLBACK;
};
var resolveChatAuthMode = function () {
    var envValue = (readEnv('NEXT_PUBLIC_CHAT_AUTH_MODE') || '').toLowerCase();
    if (envValue === 'open')
        return 'open';
    return 'strict';
};
exports.API_BASE = resolveApiBase();
exports.WS_BASE = resolveWsBase();
exports.CHAT_AUTH_MODE = resolveChatAuthMode();
