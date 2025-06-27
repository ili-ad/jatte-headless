"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePollAnswerPagination = void 0;
var react_1 = require("react");
var usePollAnswerPagination = function (_params) {
    if (_params === void 0) { _params = {}; }
    var answers = (0, react_1.useState)([])[0];
    var error = (0, react_1.useState)()[0];
    var hasNextPage = (0, react_1.useState)(true)[0];
    var loading = (0, react_1.useState)(false)[0];
    var loadMore = function () {
        throw new Error('usePollAnswerPagination not implemented');
    };
    return { answers: answers, error: error, hasNextPage: hasNextPage, loading: loading, loadMore: loadMore };
};
exports.usePollAnswerPagination = usePollAnswerPagination;
