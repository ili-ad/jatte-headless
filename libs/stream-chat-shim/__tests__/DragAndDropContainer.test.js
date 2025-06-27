"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var DragAndDropContainer_1 = require("../src/components/DragAndDrop/DragAndDropContainer");
test('renders without crashing', function () {
    (0, react_2.render)(<DragAndDropContainer_1.DragAndDropContainer>child</DragAndDropContainer_1.DragAndDropContainer>);
});
