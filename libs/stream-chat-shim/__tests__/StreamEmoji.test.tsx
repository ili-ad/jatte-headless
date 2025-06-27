import React from 'react';
import { render } from '@testing-library/react';
import { StreamEmoji } from '../src/components/Reactions/StreamEmoji';

test('renders without crashing', () => {
  render(<StreamEmoji fallback='😀' type='like' />);
});
