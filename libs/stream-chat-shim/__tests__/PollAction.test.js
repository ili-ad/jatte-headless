"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollAction_1 = require("../src/components/Poll/PollActions/PollAction");
test('renders without crashing', function () {
    (0, react_2.render)(<PollAction_1.PollAction buttonText='Button' closeModal={function () { }} modalIsOpen={false} openModal={function () { }}/>);
});
