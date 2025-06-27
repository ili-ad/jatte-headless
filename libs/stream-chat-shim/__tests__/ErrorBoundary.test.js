"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var ErrorBoundary_1 = require("../src/components/UtilityComponents/ErrorBoundary");
test('renders without crashing', function () {
    (0, react_1.render)(<ErrorBoundary_1.ErrorBoundary>
      <div>child</div>
    </ErrorBoundary_1.ErrorBoundary>);
});
