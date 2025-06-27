"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var EditMessageForm_1 = require("../src/components/MessageInput/EditMessageForm");
test('renders without crashing', function () {
    (0, react_1.render)(<EditMessageForm_1.EditMessageForm />);
});
