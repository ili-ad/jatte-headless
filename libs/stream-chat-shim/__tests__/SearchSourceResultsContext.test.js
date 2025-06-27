"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var server_1 = require("react-dom/server");
var SearchSourceResultsContext_1 = require("../src/SearchSourceResultsContext");
test('SearchSourceResultsContextProvider provides context', function () {
    var testSource = {};
    var received;
    var Consumer = function () {
        received = (0, SearchSourceResultsContext_1.useSearchSourceResultsContext)();
        return <div />;
    };
    (0, server_1.renderToStaticMarkup)(<SearchSourceResultsContext_1.SearchSourceResultsContextProvider value={{ searchSource: testSource }}>
      <Consumer />
    </SearchSourceResultsContext_1.SearchSourceResultsContextProvider>);
    expect(received === null || received === void 0 ? void 0 : received.searchSource).toBe(testSource);
});
