import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SearchSourceResultsContextProvider,
  useSearchSourceResultsContext,
  SearchSourceResultsContextValue,
} from '../src/SearchSourceResultsContext';
import type { SearchSource } from 'stream-chat';

test('SearchSourceResultsContextProvider provides context', () => {
  const testSource = {} as SearchSource;
  let received: SearchSourceResultsContextValue | undefined;

  const Consumer = () => {
    received = useSearchSourceResultsContext();
    return <div />;
  };

  renderToStaticMarkup(
    <SearchSourceResultsContextProvider value={{ searchSource: testSource }}>
      <Consumer />
    </SearchSourceResultsContextProvider>
  );

  expect(received?.searchSource).toBe(testSource);
});
