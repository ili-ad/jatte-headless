"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ThreadHeader_1 = require("../src/components/Thread/ThreadHeader");
test('renders without crashing', function () {
    (0, react_2.render)(<ThreadHeader_1.ThreadHeader closeThread={function () { }} thread={{}} overrideImage='' overrideTitle=''/>);
});
