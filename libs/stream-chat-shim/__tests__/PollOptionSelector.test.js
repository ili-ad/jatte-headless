"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollOptionSelector_1 = require("../src/components/Poll/PollOptionSelector");
test('renders without crashing', function () {
    (0, react_2.render)(<PollOptionSelector_1.PollOptionSelector option={{ id: '1', poll_id: '', text: '' }}/>);
});
