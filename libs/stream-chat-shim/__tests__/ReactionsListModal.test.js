"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ReactionsListModal_1 = require("../src/components/Reactions/ReactionsListModal");
describe('ReactionsListModal', function () {
    it('renders without crashing', function () {
        (0, react_2.render)(<ReactionsListModal_1.ReactionsListModal open={true} reactions={[]} selectedReactionType="like"/>);
    });
});
