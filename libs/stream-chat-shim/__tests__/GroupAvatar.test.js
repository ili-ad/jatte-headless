"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var GroupAvatar_1 = require("../src/components/Avatar/GroupAvatar");
test('renders without crashing', function () {
    (0, react_2.render)(<GroupAvatar_1.GroupAvatar groupChannelDisplayInfo={[]}/>);
});
