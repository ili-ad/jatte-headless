import React from 'react';
import { render } from '@testing-library/react';
import { SuggestionList } from '../src/components/TextareaComposer/SuggestionList/SuggestionList';

test('renders without crashing', () => {
  render(<SuggestionList />);
});
