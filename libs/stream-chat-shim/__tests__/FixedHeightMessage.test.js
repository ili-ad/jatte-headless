"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var FixedHeightMessage_1 = require("../src/FixedHeightMessage");
describe('FixedHeightMessage component', function () {
    it('renders message text when provided', function () {
        var getByTestId = (0, react_2.render)(<FixedHeightMessage_1.FixedHeightMessage message={{ id: '1', text: 'hello' }}/>).getByTestId;
        expect(getByTestId('fixed-height-message').textContent).toContain('hello');
    });
});
