"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var CustomMessageActionsList_1 = require("../src/components/MessageActions/CustomMessageActionsList");
test('renders without crashing', function () {
    (0, react_2.render)(<CustomMessageActionsList_1.CustomMessageActionsList message={{}} customMessageActions={{}}/>);
});
