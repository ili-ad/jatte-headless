"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var ModalGallery_1 = require("../src/components/Gallery/ModalGallery");
test('renders without crashing', function () {
    (0, react_2.render)(<ModalGallery_1.ModalGallery images={[]}/>);
});
