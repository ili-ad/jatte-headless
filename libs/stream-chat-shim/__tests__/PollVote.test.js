"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var PollVote_1 = require("../src/components/Poll/PollVote");
test('renders without crashing', function () {
    (0, react_2.render)(<PollVote_1.PollVote vote={{ id: '1', poll_id: 'p', created_at: '', updated_at: '' }}/>);
});
