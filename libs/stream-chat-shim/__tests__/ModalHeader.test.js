"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ModalHeader_1 = require("../src/components/Modal/ModalHeader");
test('renders without crashing', function () {
    (0, react_2.render)(<ModalHeader_1.ModalHeader title='Test Title'/>);
});
