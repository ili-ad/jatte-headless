"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftUpdated = void 0;
/**
 * Minimal placeholder for Stream's `draftUpdated` mock builder.
 * Returns a basic event-like object mirroring the `draft.updated` event.
 */
var draftUpdated = function (params) {
    if (params === void 0) { params = {}; }
    var draft = params.draft, client = params.client;
    return {
        type: 'draft.updated',
        draft: draft,
        user: client === null || client === void 0 ? void 0 : client.user,
    };
};
exports.draftUpdated = draftUpdated;
exports.default = exports.draftUpdated;
