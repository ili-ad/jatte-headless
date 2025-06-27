"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var reactionOptions_1 = require("../src/components/Reactions/reactionOptions");
describe('reactionOptions', function () {
    test('includes like reaction', function () {
        expect(reactionOptions_1.defaultReactionOptions.some(function (o) { return o.type === 'like'; })).toBe(true);
    });
});
