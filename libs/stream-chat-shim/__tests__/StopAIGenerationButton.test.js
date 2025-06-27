"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var StopAIGenerationButton_1 = require("../src/components/MessageInput/StopAIGenerationButton");
test('renders placeholder', function () {
    var getByTestId = (0, react_2.render)(<StopAIGenerationButton_1.StopAIGenerationButton />).getByTestId;
    expect(getByTestId('stop-ai-generation-button')).toBeTruthy();
});
