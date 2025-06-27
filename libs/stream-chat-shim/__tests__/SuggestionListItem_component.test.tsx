import React from 'react';
import { render } from '@testing-library/react';
import { SuggestionListItem } from '../src/components/TextareaComposer/SuggestionList/SuggestionListItem';

test('renders without crashing', () => {
  render(
    <SuggestionListItem
      component={() => null}
      item={{} as any}
      focused={false}
    />
  );
});
